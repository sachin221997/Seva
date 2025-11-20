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

  // Create booking with assignedWorkerId null (will be assigned next)
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

  // Try to assign a worker immediately (client-side)
  try {
    await assignWorkerForBooking(bookingRef.id);
  } catch (err) {
    console.error("Auto-assign failed (client). Will stay unassigned for now.", err);
  }

  window.location.href = "confirmation.html";
}


// ----------------------
// Assign a worker for a booking (client attempt)
// ----------------------
async function assignWorkerForBooking(bookingId) {
  // Get booking doc
  const bookingDoc = await db.collection("bookings").doc(bookingId).get();
  if (!bookingDoc.exists) throw new Error("Booking not found");

  const booking = bookingDoc.data();
  if (booking.assignedWorkerId) return; // already assigned

  // Find least busy worker (available)
  const workerId = await getLeastBusyWorker();
  if (!workerId) {
    // no worker found - leave unassigned
    console.log("No worker available now");
    return;
  }

  // Update booking with assigned worker
  await db.collection("bookings").doc(bookingId).update({
    assignedWorkerId: workerId,
    assignedAt: new Date().toISOString(),
    status: "assigned"
  });

  // Optionally mark worker as unavailable (if you want one job at time)
  // await db.collection("users").doc(workerId).update({ available: false });

  // Optionally notify worker later via cloud function or FCM
  console.log("Assigned worker:", workerId);
}


// ----------------------
// Helper: find least-busy available worker
// Strategy: find workers (role=worker) where available==true,
// and pick the one with smallest number of pending/assigned bookings.
// ----------------------
async function getLeastBusyWorker() {
  // Step 1: get available workers
  const workersSnap = await db.collection("users")
    .where("role", "==", "worker")
    .where("available", "==", true)
    .get();

  if (workersSnap.empty) return null;

  // Build array of worker ids
  const workers = workersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Step 2: for each worker, count their pending/assigned bookings
  // (we run small queries — ok for modest scale)
  let leastBusy = null;
  let leastCount = Number.POSITIVE_INFINITY;

  for (const w of workers) {
    const q = await db.collection("bookings")
      .where("assignedWorkerId", "==", w.id)
      .where("status", "in", ["assigned", "in_progress"]) // count active jobs
      .get();

    const count = q.size;
    if (count < leastCount) {
      leastCount = count;
      leastBusy = w.id;
    }
  }

  return leastBusy;
}
