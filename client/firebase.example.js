import { initializeApp } from "firebase/app";

//you can download this kind of file for your project
//firebase console => select your project => project settings

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