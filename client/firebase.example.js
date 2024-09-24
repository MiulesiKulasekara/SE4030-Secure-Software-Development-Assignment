import { initializeApp } from "firebase/app";

//Update firebaseConfig with your details
const firebaseConfig = {
  apiKey: "apiKey",
  authDomain: "authDomain",
  projectId: "projectId",
  storageBucket: "storageBucket",
  messagingSenderId: "messagingSenderId",
  appId: "appId"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);