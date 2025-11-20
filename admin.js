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


// Load Users + DELETE button
async function loadAllUsers() {
    const table = document.getElementById("usersTable");
    table.innerHTML = ""; // clear existing rows

    const snapshot = await db.collection("users").get();

    snapshot.forEach(doc => {
        const data = doc.data();

        table.innerHTML += `
            <tr>
                <td>${data.email}</td>
                <td>${data.role}</td>
                <td>₹${data.earnings || 0}</td>
                <td>
                    <button style="background:#d9534f;color:white;border:none;padding:6px 10px;border-radius:5px;"
                        onclick="deleteUser('${doc.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}


// Load Bookings + DELETE button
async function loadAllBookings() {
    const table = document.getElementById("bookingsTable");
    table.innerHTML = "";

    const snapshot = await db.collection("bookings").get();

    snapshot.forEach(doc => {
        const data = doc.data();

        table.innerHTML += `
            <tr>
                <td>${data.userEmail}</td>
                <td>${data.service}</td>
                <td>${data.status}</td>
                <td>${data.time}</td>
                <td>
                    <button style="background:#d9534f;color:white;border:none;padding:6px 10px;border-radius:5px;"
                        onclick="deleteBooking('${doc.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}


// Delete User (Firestore only)
async function deleteUser(uid) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    await db.collection("users").doc(uid).delete();
    alert("User deleted successfully!");

    loadAllUsers(); // refresh
}


// Delete Booking
async function deleteBooking(id) {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    await db.collection("bookings").doc(id).delete();
    alert("Booking deleted!");

    loadAllBookings(); // refresh
}


// Logout
function logout() {
    auth.signOut();
    window.location.href = "login.html";
}
