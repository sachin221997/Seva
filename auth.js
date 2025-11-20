// ------------------------------------------------------
// Firebase Config
// ------------------------------------------------------
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


// ------------------------------------------------------
// Signup (Create Account)
// ------------------------------------------------------
function createAccount() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            let user = userCredential.user;

            // Save user data
            db.collection("users").doc(user.uid).set({
                email,
                role: "customer",
                earnings: 0,
                available: true,
                createdAt: new Date()
            });

            alert("Account Created Successfully!");
            window.location.href = "login.html";
        })
        .catch(error => alert(error.message));
}


// ------------------------------------------------------
// Login
// ------------------------------------------------------
function login() {
    let email = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            alert("Login Successful!");
            window.location.href = "role.html";
        })
        .catch(error => alert(error.message));
}


// ------------------------------------------------------
// Logout
// ------------------------------------------------------
function logout() {
    auth.signOut().then(() => {
        alert("You have logged out.");
        window.location.href = "login.html";
    });
}


// ------------------------------------------------------
// Role Switching
// ------------------------------------------------------
function setCustomer() {
    let user = auth.currentUser;

    db.collection("users").doc(user.uid).update({ role: "customer" });
    window.location.href = "customer_home.html";
}

function setWorker() {
    let user = auth.currentUser;

    db.collection("users").doc(user.uid).update({
        role: "worker",
        available: true
    });

    window.location.href = "worker_home.html";
}


// ------------------------------------------------------
// Price Table
// ------------------------------------------------------
const SERVICE_PRICES = {
    "Home Cleaning": 250,
    "Massage Service": 250,
    "Electrician": 250,
    "Plumber": 250,
    "Carpenter": 250,
    "Cooking Help": 250
};

const PLATFORM_FEE = 50;


// ------------------------------------------------------
// Book Service (Customer)
// ------------------------------------------------------
async function bookService(serviceName) {
    let user = auth.currentUser;
    if (!user) {
        alert("Please login first!");
        window.location.href = "login.html";
        return;
    }

    const price = SERVICE_PRICES[serviceName] || 250;
    const platformFee = PLATFORM_FEE;

    let bookingRef = await db.collection("bookings").add({
        customerId: user.uid,
        userEmail: user.email,
        service: serviceName,
        price,
        platformFee,
        status: "pending",
        assignedWorkerId: null,
        assignedAt: null,
        time: new Date().toISOString(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    try {
        await assignWorkerForBooking(bookingRef.id);
    } catch (err) {
        console.error("Assignment failed:", err);
    }

    window.location.href = "confirmation.html";
}


// ------------------------------------------------------
// Auto Worker Assignment
// ------------------------------------------------------
async function assignWorkerForBooking(bookingId) {
    const bookingDoc = await db.collection("bookings").doc(bookingId).get();
    if (!bookingDoc.exists) return;

    const booking = bookingDoc.data();
    if (booking.assignedWorkerId) return;

    const workersSnap = await db.collection("users")
        .where("role", "==", "worker")
        .where("available", "==", true)
        .get();

    if (workersSnap.empty) {
        console.log("No available workers");
        return;
    }

    const selectedWorker = await getLeastBusyWorker(workersSnap);

    await db.collection("bookings").doc(bookingId).update({
        assignedWorkerId: selectedWorker,
        assignedAt: new Date().toISOString(),
        status: "assigned"
    });

    console.log("Assigned worker:", selectedWorker);
}


// ------------------------------------------------------
// Select Worker With Least Jobs
// ------------------------------------------------------
async function getLeastBusyWorker(workersSnap) {
    let leastJobs = Infinity;
    let bestWorker = null;

    for (const doc of workersSnap.docs) {
        const workerId = doc.id;

        const jobSnap = await db.collection("bookings")
            .where("assignedWorkerId", "==", workerId)
            .where("status", "in", ["assigned", "in_progress"])
            .get();

        if (jobSnap.size < leastJobs) {
            leastJobs = jobSnap.size;
            bestWorker = workerId;
        }
    }

    return bestWorker;
}


// ------------------------------------------------------
// Worker: Start Job
// ------------------------------------------------------
async function startJob(bookingId) {
    const user = auth.currentUser;
    if (!user) { alert("Login required"); return; }

    const ref = db.collection("bookings").doc(bookingId);
    const doc = await ref.get();
    if (!doc.exists) return;

    const b = doc.data();
    if (b.assignedWorkerId !== user.uid) return alert("Not your job");

    await ref.update({
        status: "in_progress",
        startedAt: new Date().toISOString()
    });

    alert("Job started");
}


// ------------------------------------------------------
// Worker: Complete Job
// ------------------------------------------------------
async function completeJob(bookingId) {
    const user = auth.currentUser;
    if (!user) { alert("Login required"); return; }

    const ref = db.collection("bookings").doc(bookingId);
    const doc = await ref.get();
    if (!doc.exists) return;

    const b = doc.data();
    if (b.assignedWorkerId !== user.uid) return alert("Not your job");

    const price = b.price || 250;
    const platformFee = typeof b.platformFee === "number" ? b.platformFee : PLATFORM_FEE;
    const workerShare = price - platformFee;

    // Update booking
    await ref.update({
        status: "completed",
        completedAt: new Date().toISOString()
    });

    // Add earnings record
    await db.collection("earnings").add({
        workerId: user.uid,
        jobId: bookingId,
        amount: workerShare,
        platformFee,
        price,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Update worker earnings
    await db.collection("users").doc(user.uid).update({
        earnings: firebase.firestore.FieldValue.increment(workerShare),
        available: true
    });

    // Update platform revenue
    await db.collection("platform").doc("revenue").set({
        totalRevenue: firebase.firestore.FieldValue.increment(platformFee)
    }, { merge: true });

    alert("Job completed. Earnings recorded.");
      }
