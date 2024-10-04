// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD5zj14aC-RywsT6P38i8y6N4KtGXLqREA",
  authDomain: "blog-website-31e31.firebaseapp.com",
  projectId: "blog-website-31e31",
  storageBucket: "blog-website-31e31.appspot.com",
  messagingSenderId: "189179141042",
  appId: "1:189179141042:web:ffbe0efde8c8096278e2ab",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Google provider and auth
const provider = new GoogleAuthProvider();
const auth = getAuth(app); // Pasamos la instancia app para evitar errores

// Google sign-in function
export const authWithGoogle = async () => {
  let user = null;

  try {
    const result = await signInWithPopup(auth, provider);
    user = result.user;
  } catch (err) {
    console.log("Error during Google sign-in:", err);
  }

  return user;
};
