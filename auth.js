// -------------------------------
//  Firebase Configuration
// -------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCHdxIjbitxh-DhK_JZvTFlSybFgKAuNCU",
  authDomain: "seva-app-22902.firebaseapp.com",
  projectId: "seva-app-22902",
  storageBucket: "seva-app-22902.firebasestorage.app",
  messagingSenderId: "352057418192",
  appId: "1:352057418192:web:6f5f7ffa0b34f0d0a4d9d5",
  measurementId: "G-31BPC3RYNB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Services
const auth = firebase.auth();
const db = firebase.firestore();


// -------------------------------
//  Create Account (Signup)
// -------------------------------
function createAccount() {
  let email = document.getElementById("email").value;
  let password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      let user = userCredential.user;

      // Save user data in Firestore
      db.collection("users").doc(user.uid).set({
        email: email,
        role: "customer",  // default role
        earnings: 0,
        createdAt: new Date()
      });

      alert("Account Created Successfully!");
      window.location.href = "login.html";
    })
    .catch(error => {
      alert(error.message);
    });
}


// -------------------------------
//  Login Function
// -------------------------------
function login() {
  let email = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login Successful!");
      window.location.href = "role.html";
    })
    .catch(error => {
      alert(error.message);
    });
}


// -------------------------------
//  Logout Function
// -------------------------------
function logout() {
  auth.signOut().then(() => {
    alert("You have logged out.");
    window.location.href = "login.html";
  });
}


// -------------------------------
//  Role Switching
// -------------------------------
function setCustomer() {
  let user = auth.currentUser;

  db.collection("users").doc(user.uid).update({
    role: "customer"
  });

  window.location.href = "customer_home.html";
}

function setWorker() {
  let user = auth.currentUser;

  db.collection("users").doc(user.uid).update({
    role: "worker"
  });

  window.location.href = "worker_home.html";
}


// -------------------------------
//  Book Service (Customer)
// -------------------------------
function bookService(serviceName) {
  let user = auth.currentUser;

  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  let booking = {
    customerId: user.uid,
    userEmail: user.email,
    service: serviceName,
    status: "pending",
    time: new Date().toISOString()
  };

  db.collection("bookings").add(booking)
    .then(() => {
      window.location.href = "confirmation.html";
    })
    .catch(error => {
      alert(error.message);
    });
}
