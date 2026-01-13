/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import cors from "cors";
import {GoogleGenAI, Type} from "@google/genai";

const corsHandler = cors({origin: true});

type AnalyzeBody = {
  employees?: unknown;
  expenses?: unknown;
  budgets?: unknown;
  context?: unknown;
};

const getGeminiKey = () => {
  // Preferred: Functions v2 secrets (set with
  // `firebase functions:secrets:set GEMINI_KEY`)
  const secret = process.env.GEMINI_KEY;
  if (secret) return secret;

  // Fallback: env vars (for local dev)
  const env = process.env.VITE_GEMINI_KEY || process.env.GEMINI_API_KEY;
  if (env) return env;

  return null;
};

const jsonError = (
  res: any,
  status: number,
  message: string,
  details?: any,
) => {
  res.status(status).json({
    error: {
      message,
  ...(details ? {details} : {}),
    },
  });
};

export const api = onRequest(
  {
    // Keep this lightweight. If you end up hitting timeouts, bump timeoutSeconds.
    timeoutSeconds: 60,
    memory: "256MiB",
    // Optional: when you set up v2 secrets, add:
    // secrets: ["GEMINI_KEY"],
  },
  (req, res) => {
    corsHandler(req, res, async () => {
      try {
        // Route
        const path = (req.path || "/").replace(/\/+$/, "");

        if (
          req.method === "GET" &&
          (path === "" || path === "/" || path === "/health")
        ) {
          return res.status(200).json({ok: true});
        }

        if (req.method !== "POST" || path !== "/ai/analyze") {
          return jsonError(res, 404, "Not found");
        }

        const key = getGeminiKey();
        if (!key) {
          return jsonError(
            res,
            500,
            "Server is missing GEMINI_KEY secret/config.",
          );
        }

        const body = (req.body || {}) as AnalyzeBody;
        const employees = Array.isArray(body.employees)
          ? body.employees
          : [];
        const expenses = Array.isArray(body.expenses) ? body.expenses : [];
        const budgets = Array.isArray(body.budgets) ? body.budgets : [];
        const context = typeof body.context === "string" ? body.context : "";

  const ai = new GoogleGenAI({apiKey: key});

        const prompt = `You are a deeply experienced Chief Financial Officer AI for "Marine Edge".

Analyze the following JSON financial data. All numeric values are INR (₹).

Context: ${context}
Data (JSON): ${JSON.stringify({employees, expenses, budgets})}

Return ONLY valid JSON matching this shape:
{
  "summary": string,
  "recommendations": string[],
  "riskLevel": "Low" | "Medium" | "High"
}

Rules:
- Keep the summary under 120 words.
- Provide 3 to 5 recommendations.
- Do not include markdown, code fences, or additional keys.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["summary", "recommendations", "riskLevel"],
              properties: {
                summary: {type: Type.STRING},
                 recommendations: {
                   type: Type.ARRAY,
                  items: {type: Type.STRING},
                },
                riskLevel: {
                  type: Type.STRING,
                  enum: ["Low", "Medium", "High"],
                },
              },
            },
          },
        });

        const rawText =
          (response as any)?.text ?? (response as any)?.response?.text ?? "";

        const parsed = JSON.parse(rawText);
        return res.status(200).json(parsed);
      } catch (err: any) {
        logger.error("AI analyze failed", err);
        const message =
          typeof err?.message === "string" ? err.message : "AI analysis failed";

        return jsonError(res, 500, message);
      }
    });
  }
);
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10});

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
