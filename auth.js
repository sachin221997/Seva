// Firebase Config (from your setup)
const firebaseConfig = {
  apiKey: "AIzaSyBxKHMjfvmhNDBXE8pHAnEcduxRA8kSVpM",
  authDomain: "seva-app-22902.firebaseapp.com",
  projectId: "seva-app-22902",
  storageBucket: "seva-app-22902.firebasestorage.app",
  messagingSenderId: "352057418192",
  appId: "1:352057418192:web:6f5f7ffa0b34f0d0a4d9d5",
  measurementId: "G-31BPC3RYNB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Login function
function login() {
  let email = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login Successful!");
      window.location.href = "seva.html"; // Redirect to service page
    })
    .catch((error) => {
      alert(error.message);
    });
    }
