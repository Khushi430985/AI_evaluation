// assets/js/home.js

const datePicker = document.getElementById('datePicker');
const activityName = document.getElementById('activityName');
const activityCategory = document.getElementById('activityCategory');
const activityMinutes = document.getElementById('activityMinutes');
const addBtn = document.getElementById('addBtn');
const clearBtn = document.getElementById('clearBtn');
const activitiesList = document.getElementById('activitiesList');
const totalTimeEl = document.getElementById('totalTime');
const remainingEl = document.getElementById('remaining');
const numActivitiesEl = document.getElementById('numActivities');
const analyseBtn = document.getElementById('analyseBtn');
const homeMsg = document.getElementById('homeMsg');
const logoutBtn = document.getElementById('logoutBtn');

let currentUid = null;
let currentDate = null;
let activities = [];

// Utility: format date for Firestore doc
function formatDateToDoc(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const today = new Date();
datePicker.value = formatDateToDoc(today);

//  AUTH GUARD
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  currentUid = user.uid;

  const params = new URLSearchParams(window.location.search);
  const qd = params.get("date");
  if (qd) datePicker.value = qd;

  loadActivitiesForSelectedDate();
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "index.html";
});

// Date change
datePicker.addEventListener("change", () => {
  loadActivitiesForSelectedDate();
});

// Clear form
clearBtn.addEventListener("click", () => {
  activityName.value = "";
  activityMinutes.value = "";
  activityCategory.value = "Work";
});

// Add Activity
addBtn.addEventListener("click", async () => {
  homeMsg.textContent = "";
  const name = activityName.value.trim();
  const cat = activityCategory.value;
  const mins = parseInt(activityMinutes.value);

  if (!name || !mins || mins <= 0) {
    homeMsg.textContent = "Enter valid name and minutes.";
    return;
  }

  const date = datePicker.value;

  const currentTotal = activities.reduce((s, a) => s + a.duration, 0);
  if (currentTotal + mins > 1440) {
    homeMsg.textContent = "Cannot exceed 1440 minutes.";
    return;
  }

  const newActivity = {
    id: Date.now().toString(),
    name,
    category: cat,
    duration: mins,
    createdAt: new Date().toISOString()
  };

  try {
    const docRef = db.collection("users").doc(currentUid).collection("days").doc(date);
    const doc = await docRef.get();
    let arr = [];
    if (doc.exists) arr = doc.data().activities || [];
    arr.push(newActivity);

    await docRef.set({ activities: arr }, { merge: true });

    activityName.value = "";
    activityMinutes.value = "";

    loadActivitiesForSelectedDate();
  } catch (err) {
    homeMsg.textContent = err.message;
  }
});

// Load activities
async function loadActivitiesForSelectedDate() {
  activitiesList.innerHTML = "";
  currentDate = datePicker.value;

  try {
    const docRef = db.collection("users").doc(currentUid).collection("days").doc(currentDate);
    const doc = await docRef.get();
    activities = doc.exists ? doc.data().activities || [] : [];

    renderActivities();
  } catch (err) {
    homeMsg.textContent = err.message;
  }
}

// Render activities
function renderActivities() {
  activitiesList.innerHTML = "";

  const total = activities.reduce((s, a) => s + a.duration, 0);
  const remaining = 1440 - total;

  totalTimeEl.textContent = `Total: ${total}m`;
  remainingEl.textContent = `Remaining: ${remaining}m`;
  numActivitiesEl.textContent = `Activities: ${activities.length}`;

  analyseBtn.disabled = total !== 1440;

  if (activities.length === 0) {
    activitiesList.innerHTML = "<div>No activities for this date.</div>";
    return;
  }

  activities.forEach(a => {
    const div = document.createElement("div");
    div.className = "activity-card";

    div.innerHTML = `
      <div style="flex:1">
        <div style="font-weight:600">${a.name}</div>
        <div class="meta">${a.category} • ${a.duration} minutes</div>
      </div>
      <div class="actions">
        <button class="btn btn-outline" data-id="${a.id}" data-action="edit">Edit</button>
        <button class="btn btn-google" data-id="${a.id}" data-action="delete">Delete</button>
      </div>
    `;

    activitiesList.appendChild(div);
  });

  // Attach events
  document.querySelectorAll(".actions button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === "delete") deleteActivity(id);
      if (action === "edit") editActivity(id);
    });
  });
}

// Delete
async function deleteActivity(id) {
  if (!confirm("Delete this activity?")) return;

  const updated = activities.filter(a => a.id !== id);

  await db.collection("users").doc(currentUid).collection("days").doc(currentDate)
    .set({ activities: updated }, { merge: true });

  loadActivitiesForSelectedDate();
}

// Edit
async function editActivity(id) {
  const item = activities.find(a => a.id === id);
  if (!item) return;

  const newName = prompt("Name:", item.name);
  if (!newName) return;

  const newMinutes = parseInt(prompt("Minutes:", item.duration));
  if (!newMinutes || newMinutes <= 0) return;

  const othersTotal = activities.filter(a => a.id !== id)
    .reduce((s, a) => s + a.duration, 0);

  if (othersTotal + newMinutes > 1440) {
    alert("Edit exceeds 1440 minutes.");
    return;
  }

  const updated = activities.map(a =>
    a.id === id ? { ...a, name: newName, duration: newMinutes } : a
  );

  await db.collection("users").doc(currentUid).collection("days").doc(currentDate)
    .set({ activities: updated }, { merge: true });

  loadActivitiesForSelectedDate();
}

// Analyse → dashboard
analyseBtn.addEventListener("click", () => {
  window.location.href = `dashboard.html?date=${currentDate}`;
});