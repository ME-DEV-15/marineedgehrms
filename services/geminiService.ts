
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, Expense, Budget } from '../types';

const getClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_KEY;
;
  if (!apiKey) {
    console.warn("API_KEY is not set. Gemini features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFinances = async (
  employees: Employee[],
  expenses: Expense[],
  budgets: Budget[],
  context: string
): Promise<any> => {
  const ai = getClient();
  if (!ai) return null;

  // Prepare data summary to reduce token usage while keeping context
  const financialData = {
    context,
    currency: "INR (₹)",
    totalMonthlyPayroll: employees.reduce((acc, emp) => acc + (emp.annualSalary / 12), 0),
    totalExpenses: expenses.reduce((acc, exp) => acc + exp.amount, 0),
    departmentBreakdown: budgets.map(b => {
      const deptExpenses = expenses.filter(e => e.department === b.department).reduce((a, e) => a + e.amount, 0);
      const deptSalaries = employees.filter(e => e.department === b.department).reduce((a, e) => a + (e.annualSalary / 12), 0);
      return {
        department: b.department,
        budget: b.amount,
        spent: deptExpenses + deptSalaries,
        details: { expenses: deptExpenses, payroll: deptSalaries }
      };
    })
  };

  const prompt = `
    You are a deeply experienced Chief Financial Officer AI for 'Marine Edge', a modern organization.
    Analyze the following JSON financial data for our organization. All values are in INR (₹).
    
    Context: ${context}
    Data: ${JSON.stringify(financialData)}

    Please provide:
    1. A brief executive summary of the financial health.
    2. 3-4 specific, actionable recommendations to optimize spend or budget.
    3. A risk assessment (Low, Medium, High).
    
    Respond in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
