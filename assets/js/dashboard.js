// assets/js/dashboard.js
let dashUid = null;
let dashDateInput = document.getElementById('dashDate');
let summaryStats = document.getElementById('summaryStats');
let detailList = document.getElementById('detailList');
let noDataCard = document.getElementById('noDataCard');
let goAddBtn = document.getElementById('goAdd');
let backHomeBtn = document.getElementById('backHome');
let dashMsg = document.getElementById('dashMsg');

let pieChart = null;
let barChart = null;

// default date = query param or today
const params = new URLSearchParams(window.location.search);
const qd = params.get('date');
function formatDateToDoc(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}
const today = new Date();
dashDateInput.value = qd || formatDateToDoc(today);

// auth guard
auth.onAuthStateChanged(user => {
  if(!user) {
    window.location.href = 'index.html';
    return;
  }
  dashUid = user.uid;
  loadForDate(dashDateInput.value);
});

// date listener
dashDateInput.addEventListener('change', () => loadForDate(dashDateInput.value));

// buttons
if(goAddBtn) goAddBtn.addEventListener('click', () => {
  const dt = dashDateInput.value;
  window.location.href = `home.html?date=${dt}`;
});
if(backHomeBtn) backHomeBtn.addEventListener('click', () => { window.location.href = 'home.html'; });

// load data
async function loadForDate(date) {
  summaryStats.innerHTML = '';
  detailList.innerHTML = '';
  dashMsg.textContent = '';
  noDataCard.style.display = 'none';
  if(!dashUid) return;

  try {
    const docRef = db.collection('users').doc(dashUid).collection('days').doc(date);
    const doc = await docRef.get();
    if(!doc.exists || !(doc.data().activities && doc.data().activities.length)) {
      // no data
      noDataCard.style.display = 'block';
      clearCharts();
      return;
    }

    const activities = doc.data().activities || [];
    renderSummary(activities);
    renderDetailList(activities);
    renderCharts(activities);
  } catch(err) {
    dashMsg.textContent = err.message;
  }
}

function renderSummary(activities) {
  const total = activities.reduce((s,a) => s + a.duration, 0);
  const num = activities.length;
  // group by category
  const byCat = {};
  activities.forEach(a => { byCat[a.category] = (byCat[a.category] || 0) + a.duration; });

  summaryStats.innerHTML = `
    <div class="chip">Total: ${total}m (${Math.floor(total/60)}h ${total%60}m)</div>
    <div class="chip">Activities: ${num}</div>
    <div class="chip">Unique categories: ${Object.keys(byCat).length}</div>
  `;
}

function renderDetailList(activities) {
  detailList.innerHTML = activities.map(a => {
    return `<div style="padding:8px;border-bottom:1px dashed var(--border);">
      <div style="font-weight:700">${escapeHtml(a.name)}</div>
      <div class="meta">${escapeHtml(a.category)} • ${a.duration} minutes</div>
    </div>`;
  }).join('');
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function renderCharts(activities) {
  // destroy existing
  clearCharts();

  // Bar chart: activity names vs duration
  const labels = activities.map(a => a.name);
  const data = activities.map(a => a.duration);

  const barCtx = document.getElementById('barChart').getContext('2d');
  barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Minutes',
        data,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // Pie chart: time per category
  const catMap = {};
  activities.forEach(a => catMap[a.category] = (catMap[a.category] || 0) + a.duration);
  const pieLabels = Object.keys(catMap);
  const pieData = Object.values(catMap);

  const pieCtx = document.getElementById('pieChart').getContext('2d');
  pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: pieLabels,
      datasets: [{
        data: pieData,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function clearCharts() {
  if(barChart) { barChart.destroy(); barChart = null; }
  if(pieChart) { pieChart.destroy(); pieChart = null; }
}