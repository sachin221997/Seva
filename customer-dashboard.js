// CUSTOMER NOTIFICATIONS

firebase.auth().onAuthStateChanged(user => {
  if (!user) return;

  db.collection("notifications")
    .where("toUser", "==", user.uid)
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {

      let html = "";

      if (snapshot.empty) {
        html = "<div class='small'>No notifications yet</div>";
      }

      snapshot.forEach(doc => {
        const n = doc.data();
        html += `
          <div class="notification-card">
            🔔 ${n.message}
          </div>
        `;
      });

      document.getElementById("notifications").innerHTML = html;
    });
});
