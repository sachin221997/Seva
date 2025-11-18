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
function createAccount() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Account Created Successfully! You can log in now.");
      window.location.href = "login.html";
    })
    .catch((error) => {
      alert(error.message);
    });
    }
// Login function
function logout() {
  firebase.auth().signOut().then(() => {
    alert("You have logged out.");
    window.location.href = "login.html";
  });
}
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
function bookService(serviceName) {
  let user = firebase.auth().currentUser;

  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  let booking = {
    userEmail: user.email,
    service: serviceName,
    time: new Date().toISOString()
  };

  firebase.firestore().collection("bookings").add(booking)
    .then(() => {
    window.location.href = "confirmation.html";
})
  
    .catch(error => {
      alert(error.message);
    });
    }
