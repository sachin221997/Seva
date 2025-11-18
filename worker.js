// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBxKMHjfwnhNDBXEk8pHAnEcduxRA8kSVpM",
    authDomain: "seva-app-22902.firebaseapp.com",
    projectId: "seva-app-22902",
    storageBucket: "seva-app-22902.firebasestorage.app",
    messagingSenderId: "352057418192",
    appId: "1:352057418192:web:6f5f7ffa0b34f0d0a4d9d5",
    measurementId: "G-31BPC3RYNB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Worker Login
function workerLogin() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
        window.location.href = "worker-dashboard.html";
    })
    .catch(error => {
        alert(error.message);
    });
}
                                        
