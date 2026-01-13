import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCSGzQoFJV6M_JsWRbVRSY3mqT5HA5KFzE",
  authDomain: "marine-edge-hrms.firebaseapp.com",
  projectId: "marine-edge-hrms",
  storageBucket: "marine-edge-hrms.appspot.com",
  messagingSenderId: "461993692680",
  appId: "1:461993692680:web:f4cf8cc417b214a11acbbd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
