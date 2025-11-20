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


// ----------------------
// Book Service (Customer)
// ----------------------
async function bookService(serviceName) {
  let user = auth.currentUser;

  if (!user) {
    alert("Please login first!");
    window.location.href = "login.html";
    return;
  }

  // Create booking with assignedWorkerId null first
  let bookingRef = await db.collection("bookings").add({
    customerId: user.uid,
    userEmail: user.email,
    service: serviceName,
    status: "pending",
    assignedWorkerId: null,
    assignedAt: null,
    time: new Date().toISOString(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Try assigning worker immediately
  try {
    await assignWorkerForBooking(bookingRef.id);
  } catch (err) {
    console.error("Assignment failed:", err);
  }

  // Move to confirmation page
  window.location.href = "confirmation.html";
}


// ----------------------------
// Assign Worker Automatically
// ----------------------------
async function assignWorkerForBooking(bookingId) {
  const bookingDoc = await db.collection("bookings").doc(bookingId).get();
  if (!bookingDoc.exists) return;

  const booking = bookingDoc.data();

  // If already assigned, stop
  if (booking.assignedWorkerId) return;

  // Get available workers
  const workersSnap = await db.collection("users")
    .where("role", "==", "worker")
    .where("available", "==", true)
    .get();

  if (workersSnap.empty) {
    console.log("No available workers right now.");
    return;
  }

  // Pick least busy worker
  const workerId = await getLeastBusyWorker(workersSnap);

  if (!workerId) {
    console.log("Could not find worker.");
    return;
  }

  // Assign worker to booking
  await db.collection("bookings").doc(bookingId).update({
    assignedWorkerId: workerId,
    assignedAt: new Date().toISOString(),
    status: "assigned"
  });

  console.log("Assigned worker:", workerId);
}


// -------------------------------
// Helper: Least Busy Worker Logic
// -------------------------------
async function getLeastBusyWorker(workersSnap) {
  let leastBusyWorker = null;
  let leastJobs = Infinity;

  for (const doc of workersSnap.docs) {
    const workerId = doc.id;

    const jobSnap = await db.collection("bookings")
      .where("assignedWorkerId", "==", workerId)
      .where("status", "in", ["assigned", "in_progress"])
      .get();

    const jobCount = jobSnap.size;

    if (jobCount < leastJobs) {
      leastJobs = jobCount;
      leastBusyWorker = workerId;
    }
  }

  return leastBusyWorker;
    }
    
