<!-- Firebase V8 SDK -->
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>

<script>
// Your Firebase Config
var firebaseConfig = {
  apiKey: "AIzaSyBOcsJLpaNSVcFo-Xl6UFEtItcoyxRFzik",
  authDomain: "seva-6f191.firebaseapp.com",
  projectId: "seva-6f191",
  storageBucket: "seva-6f191.appspot.com",
  messagingSenderId: "826093348416",
  appId: "1:826093348416:web:19fefe43b9b7cba09b21a5",
  measurementId: "G-78H32SRPCD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make services global
const auth = firebase.auth();
const db = firebase.firestore();
</script>
