// Only admin email allowed
const adminEmailAllowed = "sachiny4561@gmail.com";

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // DENY IF NOT ADMIN
    if (user.email !== adminEmailAllowed) {
        alert("Access Denied! You are not an admin.");
        window.location.href = "login.html";
        return;
    }

    document.getElementById("adminEmail").innerText =
        "Logged in as Admin: " + user.email;

    loadAllUsers();
    loadAllBookings();
});


// Load all users
async function loadAllUsers() {
    const table = document.getElementById("usersTable");
    const snapshot = await db.collection("users").get();

    snapshot.forEach(doc => {
        const data = doc.data();

        table.innerHTML += `
            <tr>
                <td>${data.email}</td>
                <td>${data.role}</td>
                <td>₹${data.earnings || 0}</td>
            </tr>
        `;
    });
}


// Load all bookings
async function loadAllBookings() {
    const table = document.getElementById("bookingsTable");
    const snapshot = await db.collection("bookings").get();

    snapshot.forEach(doc => {
        const data = doc.data();

        table.innerHTML += `
            <tr>
                <td>${data.userEmail}</td>
                <td>${data.service}</td>
                <td>${data.status}</td>
                <td>${data.time}</td>
            </tr>
        `;
    });
              }
