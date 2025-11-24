// =============================
// auth.js - Full (Firebase v8)
// Contains:
//  - Firebase init (v8)
//  - Signup / Login / Logout
//  - Role switch (customer / worker)
//  - postJobFromForm (reads form fields used in customer_post.html)
//  - postJob (generic job create)
//  - acceptJob (worker accepts a job)
//  - startJob / completeJob
//  - earnings & platform revenue updates
//  - helpful utilities & robust error handling
// =============================


/* ============================
   CONFIG & INIT (Firebase v8)
   Replace these values only if you have different project settings.
   Make sure every page uses this same config + Firebase v8 SDK scripts.
   ============================ */
var firebaseConfig = {
    apiKey: "AIzaSyBOcsJLpaNSVcFo-Xl6UFEtItcoyxRFzik",
    authDomain: "seva-6f191.firebaseapp.com",
    projectId: "seva-6f191",
    storageBucket: "seva-6f191.firebasestorage.app",
    messagingSenderId: "826093348416",
    appId: "1:826093348416:web:19fefe43b9b7cba09b21a5",
    measurementId: "G-78H32SRPCD"
};
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Platform fee constant (INR)
const PLATFORM_FEE = 50;


// ===========================
// AUTH: Signup
// Reads #email and #password inputs if present on page
// ===========================
function signup() {
    const emailEl = document.getElementById("email");
    const passEl = document.getElementById("password");
    if (!emailEl || !passEl) {
        alert("Signup inputs not found.");
        return;
    }
    const email = emailEl.value.trim();
    const password = passEl.value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
        const user = userCredential.user;
        // create user doc
        return db.collection("users").doc(user.uid).set({
            email: email,
            role: "customer",
            earnings: 0,
            available: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    })
    .then(() => {
        alert("Account created successfully. Please login.");
        window.location.href = "login.html";
    })
    .catch(err => {
        console.error("Signup error:", err);
        alert(err.message);
    });
}


// ===========================
// AUTH: Login
// Reads #username and #password
// ===========================
function login() {
    const emailEl = document.getElementById("username");
    const passEl = document.getElementById("password");
    if (!emailEl || !passEl) {
        alert("Login inputs not found.");
        return;
    }
    const email = emailEl.value.trim();
    const password = passEl.value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
    .then(() => {
        // after login, go to role selection or home
        window.location.href = "role.html";
    })
    .catch(err => {
        console.error("Login error:", err);
        alert(err.message);
    });
}


// ===========================
// AUTH: Logout
// ===========================
function logout() {
    auth.signOut()
    .then(() => {
        // simple feedback & redirect
        alert("Logged out successfully.");
        window.location.href = "login.html";
    })
    .catch(err => {
        console.error("Logout error:", err);
        alert(err.message);
    });
}


// ===========================
// Role switching helpers
// setCustomer(), setWorker()
// ===========================
function setCustomer() {
    const user = auth.currentUser;
    if (!user) return alert("Please login first.");
    db.collection("users").doc(user.uid).set({
        role: "customer"
    }, { merge: true })
    .then(() => {
        window.location.href = "customer_home.html";
    })
    .catch(err => {
        console.error("setCustomer error:", err);
        alert(err.message);
    });
}

function setWorker() {
    const user = auth.currentUser;
    if (!user) return alert("Please login first.");
    db.collection("users").doc(user.uid).set({
        role: "worker",
        available: true
    }, { merge: true })
    .then(() => {
        window.location.href = "worker_home.html";
    })
    .catch(err => {
        console.error("setWorker error:", err);
        alert(err.message);
    });
}


// ===========================
// JOB: Generic helper - postJob(jobObj)
// jobObj expected keys:
//  title, description, type, amount, location, hours, customerId, customerEmail, voiceFile(optional: File object)
// Saves job in 'jobs' collection and uploads voice if present.
// ===========================
async function postJob(jobObj) {
    if (!jobObj || !jobObj.title || !jobObj.description || !jobObj.type || !jobObj.amount || !jobObj.location) {
        throw new Error("Missing required job fields.");
    }

    // enforce platform rules
    let amount = Number(jobObj.amount);
    if (isNaN(amount)) throw new Error("Amount must be a number.");

    if (jobObj.type === "massage") {
        amount = 250; // fixed
        jobObj.hours = jobObj.hours || "1 hour";
    } else if (jobObj.type === "delivery") {
        if (amount < 200) throw new Error("Delivery / Normal help requires minimum ₹200.");
    } else {
        if (amount <= PLATFORM_FEE) throw new Error("Amount must be greater than platform fee.");
    }

    const platformFee = PLATFORM_FEE;
    const workerMoney = amount - platformFee;

    // prepare doc
    const jobDoc = {
        title: jobObj.title,
        description: jobObj.description,
        type: jobObj.type,
        amount: amount,
        location: jobObj.location,
        hours: jobObj.hours || null,
        customerId: jobObj.customerId || null,
        customerEmail: jobObj.customerEmail || null,
        workerId: null,
        platformFee: platformFee,
        workerMoney: workerMoney,
        status: "pending",
        voiceUrl: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // upload voice if provided (File)
    if (jobObj.voiceFile && jobObj.customerId) {
        try {
            const file = jobObj.voiceFile;
            const ext = file.name.split('.').pop();
            const path = `voice_notes/${jobObj.customerId}_${Date.now()}.${ext}`;
            const ref = storage.ref().child(path);
            const snap = await ref.put(file);
            const url = await snap.ref.getDownloadURL();
            jobDoc.voiceUrl = url;
        } catch (err) {
            console.warn("Voice upload failed, continuing without voice:", err);
            // continue without voice
        }
    }

    // save job
    const docRef = await db.collection("jobs").add(jobDoc);
    return docRef.id;
}


// ===========================
// JOB: Form binder - postJobFromForm()
// Reads the DOM IDs used in customer_post.html (title, description, jobType, amount, hours, location, voice)
// ===========================
async function postJobFromForm() {
    const user = auth.currentUser;
    if (!user) {
        alert("Please login to post a job.");
        window.location.href = "login.html";
        return;
    }

    // Element IDs (as in customer_post.html)
    const jobTypeEl = document.getElementById('jobType');
    const titleEl = document.getElementById('title');
    const descEl = document.getElementById('description');
    const hoursEl = document.getElementById('hours');
    const amountEl = document.getElementById('amount');
    const locationEl = document.getElementById('location');
    const voiceEl = document.getElementById('voice');
    const postBtn = document.getElementById('postBtn');
    const statusMsg = document.getElementById('statusMsg');

    if (!jobTypeEl || !titleEl || !descEl || !amountEl || !locationEl) {
        alert("Form elements not found on page.");
        return;
    }

    const type = jobTypeEl.value;
    const title = titleEl.value.trim();
    const description = descEl.value.trim();
    let hours = (hoursEl && hoursEl.value) ? hoursEl.value.trim() : "";
    let amount = Number(amountEl.value || 0);
    const location = locationEl.value.trim();

    // validation (same rules as earlier)
    if (!title) return alert("Please add a short title for the job.");
    if (!description) return alert("Please describe the job.");
    if (!location) return alert("Please enter a location.");

    if (type === 'massage') {
        amount = 250;
        hours = "1 hour";
    } else if (type === 'delivery') {
        if (!amount || amount < 200) return alert("Delivery / Normal help requires minimum ₹200.");
    } else {
        if (!amount || amount <= PLATFORM_FEE) return alert("Please set an amount greater than platform fee (₹50).");
    }

    // disable UI
    if (postBtn) postBtn.disabled = true;
    if (statusMsg) statusMsg.innerText = "Posting job...";

    try {
        const voiceFile = (voiceEl && voiceEl.files && voiceEl.files[0]) ? voiceEl.files[0] : null;
        const jobId = await postJob({
            title,
            description,
            type,
            amount,
            location,
            hours,
            customerId: user.uid,
            customerEmail: user.email || null,
            voiceFile: voiceFile
        });

        if (statusMsg) statusMsg.innerText = "Job posted successfully!";
        alert("Job posted! Workers will see and can accept it.");
        // redirect or clear
        window.location.href = "customer_home.html";
        return jobId;
    } catch (err) {
        console.error("postJobFromForm error:", err);
        alert("Error posting job: " + err.message);
        if (statusMsg) statusMsg.innerText = "Error: " + err.message;
        throw err;
    } finally {
        if (postBtn) postBtn.disabled = false;
    }
}


// ===========================
// JOB: Accept a job (worker action)
// - sets workerId, status='assigned', assignedAt
// - prevents race conditions by transaction
// ===========================
async function acceptJob(jobId) {
    const user = auth.currentUser;
    if (!user) return alert("Please login.");

    const jobRef = db.collection("jobs").doc(jobId);

    try {
        await db.runTransaction(async (tx) => {
            const jobDoc = await tx.get(jobRef);
            if (!jobDoc.exists) throw new Error("Job does not exist.");
            const job = jobDoc.data();

            if (job.status !== "pending") {
                throw new Error("Job already taken.");
            }

            // assign
            tx.update(jobRef, {
                workerId: user.uid,
                status: "assigned",
                assignedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        alert("Job accepted! Redirecting to your active jobs.");
        window.location.href = "worker_home.html";
    } catch (err) {
        console.error("acceptJob error:", err);
        alert(err.message);
    }
}


// ===========================
// JOB: startJob(jobId) - worker marks in_progress
// ===========================
async function startJob(jobId) {
    if (!jobId) return alert("jobId required.");
    const user = auth.currentUser;
    if (!user) return alert("Please login.");

    const jobRef = db.collection("jobs").doc(jobId);

    try {
        const doc = await jobRef.get();
        if (!doc.exists) return alert("Job not found.");
        const job = doc.data();
        if (job.workerId !== user.uid) return alert("This is not your job.");
        if (job.status !== "assigned") return alert("Job must be assigned to start.");

        await jobRef.update({
            status: "in_progress",
            startedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Job started.");
    } catch (err) {
        console.error("startJob error:", err);
        alert(err.message);
    }
}


// ===========================
// JOB: completeJob(jobId) - worker completes the job
// - marks job completed
// - increments worker earnings
// - increments platform/admin earnings by PLATFORM_FEE
// - creates earning record
// ===========================
async function completeJob(jobId) {
    if (!jobId) return alert("jobId required.");
    const user = auth.currentUser;
    if (!user) return alert("Please login.");

    const jobRef = db.collection("jobs").doc(jobId);

    try {
        // read job once to compute amounts
        const jobSnap = await jobRef.get();
        if (!jobSnap.exists) return alert("Job not found.");
        const job = jobSnap.data();

        if (job.workerId !== user.uid) return alert("This is not your job.");
        if (job.status !== "in_progress" && job.status !== "assigned") {
            return alert("Job is not in a state that can be completed.");
        }

        // worker earning = amount - PLATFORM_FEE
        // compute precisely using integers
        const amount = Number(job.amount);
        if (isNaN(amount)) throw new Error("Invalid job amount.");

        const workerEarn = amount - PLATFORM_FEE;
        if (workerEarn < 0) throw new Error("Worker earning negative - check amount.");

        // Perform batched updates
        const batch = db.batch();

        // mark job completed
        batch.update(jobRef, {
            status: "completed",
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // add earnings record
        const earningsRef = db.collection("earnings").doc();
        batch.set(earningsRef, {
            workerId: user.uid,
            jobId: jobId,
            amount: workerEarn,
            platformFee: PLATFORM_FEE,
            totalPaidByCustomer: amount,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // update worker document earnings
        const workerRef = db.collection("users").doc(user.uid);
        batch.update(workerRef, {
            earnings: firebase.firestore.FieldValue.increment(workerEarn),
            available: true
        });

        // update platform revenue doc (merge)
        const platformRef = db.collection("platform").doc("revenue");
        // Using batch cannot do FieldValue.increment on a non-existing doc with set via batch.update,
        // so use transaction for platform increment separately to be safe.
        await batch.commit();

        // increment platform revenue via transaction (so it works even if doc missing)
        await db.runTransaction(async (tx) => {
            const pdoc = await tx.get(platformRef);
            if (!pdoc.exists) {
                tx.set(platformRef, { total: PLATFORM_FEE });
            } else {
                tx.update(platformRef, { total: firebase.firestore.FieldValue.increment(PLATFORM_FEE) });
            }
        });

        alert("Job completed. Your earnings updated.");
        // optional: navigate to worker_home to reflect changes
        window.location.href = "worker_home.html";

    } catch (err) {
        console.error("completeJob error:", err);
        alert(err.message);
    }
}


// ===========================
// UTIL: getCurrentUserRole()
// reads 'users' doc role field
// ===========================
async function getCurrentUserRole() {
    const user = auth.currentUser;
    if (!user) return null;
    try {
        const doc = await db.collection("users").doc(user.uid).get();
        if (!doc.exists) return null;
        const data = doc.data();
        return data.role || null;
    } catch (err) {
        console.error("getCurrentUserRole error:", err);
        return null;
    }
}


// ===========================
// UTIL: Protect pages by role
// Example usage:
//  protectPage(['worker']) OR protectPage(['customer'])
// It will redirect to login if not logged, or to role.html if role mismatch
// ===========================
function protectPage(allowedRoles = []) {
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        if (allowedRoles.length === 0) return; // no role required
        const role = await getCurrentUserRole();
        if (!role || !allowedRoles.includes(role)) {
            // redirect to role selection if role not set
            window.location.href = "role.html";
        }
    });
}


// ===========================
// EXPORT / AUTO-HOOKS (optional)
// If pages include this file, they can call protectPage([...]) on load
// Example in worker_home.html: protectPage(['worker'])
// Example in customer_home.html: protectPage(['customer'])
// ===========================
// No explicit export required for browser usage.


// ===========================
// OPTIONAL: quick test helper (not required in production)
// window.testPost = async () => {
//   const id = await postJob({
//     title: "Test job",
//     description: "Test desc",
//     type: "hardwork",
//     amount: 300,
//     location: "Test City",
//     hours: "2 hours",
//     customerId: auth.currentUser ? auth.currentUser.uid : null,
//     customerEmail: auth.currentUser ? auth.currentUser.email : null
//   });
//   console.log("Created job id:", id);
// };
// ===========================

/* End of auth.js */
