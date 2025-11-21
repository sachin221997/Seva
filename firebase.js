import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOcsJLpaNSVcFo-Xl6UFEtItcoyxRFzik",
  authDomain: "seva-6f191.firebaseapp.com",
  projectId: "seva-6f191",
  storageBucket: "seva-6f191.firebasestorage.app",
  messagingSenderId: "826093348416",
  appId: "1:826093348416:web:19fefe43b9b7cba09b21a5",
  measurementId: "G-78H32SRPCD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.auth = auth;
