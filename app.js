/* app.js
   - Replace BASE_API_URL and the endpoints with the actual API from the Postman docs.
   - If the API requires authentication, add the Authorization header where indicated.
*/

const BASE_API_URL = "https://fedskillstest.coalitiontechnologies.workers.dev"; // <-- REPLACE with the real base URL from the API docs
const PATIENTS_ENDPOINT = "/"; // <-- REPLACE with the real endpoint path if different
const USERNAME = "coalition";
const PASSWORD = "skills-test";

// DOM references
const patientListEl = document.getElementById("patientList");
const profileNameEl = document.getElementById("profileName");
const dobEl = document.getElementById("dob");
const genderEl = document.getElementById("gender");
const contactInfoEl = document.getElementById("contactInfo");
const emergencyEl = document.getElementById("emergency");
const insuranceEl = document.getElementById("insurance");
const heartRateEl = document.getElementById("heartRate");
const tempEl = document.getElementById("temp");
const respRateEl = document.getElementById("respRate");
const bpStatsEl = document.getElementById("bpStats");
const diagTableBody = document.querySelector("#diagTable tbody");
const showAllBtn = document.getElementById("showAllBtn");

let bpChart = null;


const mockPatient = {
  id: "jessica-taylor-001",
  name: "Jessica Taylor",
  dob: "1996-08-23",
  gender: "Female",
  contact: "(415) 555-1234",
  emergency: "(415) 555-5678",
  insurance: "Sunrise Health Assurance",
  profile_picture: "",
  vitals: {
    heartRate: 78,
    temperature: 98.6,
    respiratoryRate: 20
  },
  diagnostics: [
    { problem: "Hypertension", description: "Chronic high blood pressure", status: "Under Observation" },
    { problem: "Type 2 Diabetes", description: "Insulin resistance and elevated blood sugar", status: "Cured" },
    { problem: "Asthma", description: "Recurrent episodes of bronchial constriction", status: "Inactive" }
  ],
  bpHistory: [
    // monthly (or yearly) timestamps and systolic/diastolic
    { date: "2023-10", systolic: 120, diastolic: 110 },
    { date: "2023-11", systolic: 125, diastolic: 90 },
    { date: "2023-12", systolic: 160, diastolic: 110 },
    { date: "2024-01", systolic: 140, diastolic: 100 },
    { date: "2024-02", systolic: 150, diastolic: 92 },
    { date: "2024-03", systolic: 156, diastolic: 85 }
  ]
};

// Utility: format date
function formatDate(isoOrYmd) {
  try {
    const d = new Date(isoOrYmd);
    if (!isNaN(d)) {
      return d.toLocaleDateString();
    } else {
      // If the input is YYYY-MM or YYYY-MM-DD
      if (/^\d{4}-\d{2}$/.test(isoOrYmd)) {
        const [y,m] = isoOrYmd.split("-");
        return `${m}/${y}`;
      }
      return isoOrYmd;
    }
  } catch(e) {
    return isoOrYmd;
  }
}

// Render patient list (we only need to highlight Jessica; template shows many but instruction says show only Jessica)
function renderPatientList(patients = [mockPatient]) {
  patientListEl.innerHTML = "";
  patients.forEach(p => {
    const avatarSrc = p.profile_picture || "https://fedskillstest.ct.digital/4.png"; // fallback
    const li = document.createElement("li");
    li.className = "patient-item" + (p.name === "Jessica Taylor" ? " active" : "");
    li.innerHTML = `
      <img class="avatar" src="${avatarSrc}" alt="${p.name}" />
      <div>
        <div style="font-weight:600">${p.name}</div>
        <div class="meta">${p.gender || ""}${p.dob ? ", " + (new Date().getFullYear() - new Date(p.dob).getFullYear()) + " yrs" : ""}</div>
      </div>
    `;
    patientListEl.appendChild(li);
  });
}

// Populate profile, vitals and diagnostic table
function populateUI(patient) {
  if (!patient) patient = mockPatient;

  profileNameEl.textContent = patient.name || "Jessica Taylor";
  dobEl.textContent = patient.dob ? formatDate(patient.dob) : "-";
  genderEl.textContent = patient.gender || "-";
  contactInfoEl.textContent = patient.contact || "-";
  emergencyEl.textContent = patient.emergency || "-";
  insuranceEl.textContent = patient.insurance || "-";

  // Vitals
  heartRateEl.textContent = (patient.vitals?.heartRate ?? "-") + (patient.vitals?.heartRate ? " bpm" : "");
  tempEl.textContent = (patient.vitals?.temperature ?? "-") + (patient.vitals?.temperature ? "°F" : "");
  respRateEl.textContent = (patient.vitals?.respiratoryRate ?? "-") + (patient.vitals?.respiratoryRate ? " bpm" : "");

  // Diagnostics table
  diagTableBody.innerHTML = "";
  (patient.diagnostics || []).forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.problem}</td><td>${d.description}</td><td>${d.status}</td>`;
    diagTableBody.appendChild(tr);
  });

  // BP stats text summary
  const latest = (patient.bpHistory && patient.bpHistory[patient.bpHistory.length - 1]) || null;
  if (latest) {
    bpStatsEl.innerHTML = `<div><strong>Systolic</strong> ${latest.systolic} — <small>Higher than Average</small></div>
                           <div style="margin-top:6px"><strong>Diastolic</strong> ${latest.diastolic} — <small>Lower than Average</small></div>`;
  }

  // Render chart
  renderBPChart(patient.bpHistory || []);
}

// Render blood pressure chart using Chart.js
function renderBPChart(bpHistory) {
  const ctx = document.getElementById("bpChart").getContext("2d");

  const labels = bpHistory.map(b => b.date);
  const systolic = bpHistory.map(b => b.systolic);
  const diastolic = bpHistory.map(b => b.diastolic);

  if (bpChart) bpChart.destroy();

  bpChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Systolic",
          data: systolic,
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          pointRadius: 4,
          borderColor: "#ff6b9e",
          pointBackgroundColor: "#ff6b9e"
        },
        {
          label: "Diastolic",
          data: diastolic,
          borderWidth: 2,
          tension: 0.35,
          fill: false,
          pointRadius: 4,
          borderColor: "#6b7cff",
          pointBackgroundColor: "#6b7cff"
        }
      ]
    },
    options: {
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: { beginAtZero: false, suggestedMin: 60, suggestedMax: 180 },
        x: { grid: { display: false } }
      },
      maintainAspectRatio: false,
      responsive: true
    }
  });
}


async function fetchAllPatients() {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Authorization": "Basic " + btoa(`${USERNAME}:${PASSWORD}`)
  });

  try {
    const url = `${BASE_API_URL}${PATIENTS_ENDPOINT}`;
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) throw new Error("API responded with " + res.status);
    const data = await res.json();

    // If API returns an array of patients, map to internal shape
    if (Array.isArray(data)) {
      return data.map(found => ({
        id: (found.patient_id || found.id || (found.name || "").toLowerCase().replace(/\s+/g,'-')),
        name: found.name,
        dob: found.date_of_birth || found.dob || found.dateOfBirth,
        gender: found.gender,
        contact: found.phone_number,
        emergency: found.emergency_contact,
        insurance: found.insurance_type || found.insurance_provider,
        profile_picture: found.profile_picture || found.profile_picture_url || "",
        vitals: {
          heartRate: found.diagnosis_history?.[0]?.heart_rate?.value ?? null,
          temperature: found.diagnosis_history?.[0]?.temperature?.value ?? null,
          respiratoryRate: found.diagnosis_history?.[0]?.respiratory_rate?.value ?? null
        },
        diagnostics: (found.diagnostic_list || found.diagnostics || []).map(d => ({
          problem: d.name || d.problem,
          description: d.description,
          status: d.status
        })),
        bpHistory: (found.diagnosis_history || []).map(h => ({
          date: `${h.month || ""}-${h.year || ""}`,
          systolic: h.blood_pressure?.systolic?.value ?? null,
          diastolic: h.blood_pressure?.diastolic?.value ?? null
        })).reverse()
      }));
    }

    // If response contains patients in a nested field
    if (data && data.patients && Array.isArray(data.patients)) {
      return fetchAllPatients(data.patients);
    }

    // fallback single-object mapping
    if (data && (data.name || data.fullName)) {
      return [ (await (async () => { 
        const found = data;
        return {
          id: found.patient_id || found.id || (found.name || "").toLowerCase().replace(/\s+/g,'-'),
          name: found.name,
          dob: found.date_of_birth || found.dob,
          gender: found.gender,
          contact: found.phone_number,
          emergency: found.emergency_contact,
          insurance: found.insurance_type || found.insurance_provider,
          profile_picture: found.profile_picture || "",
          vitals: {
            heartRate: found.diagnosis_history?.[0]?.heart_rate?.value ?? null,
            temperature: found.diagnosis_history?.[0]?.temperature?.value ?? null,
            respiratoryRate: found.diagnosis_history?.[0]?.respiratory_rate?.value ?? null
          },
          diagnostics: (found.diagnostic_list || found.diagnostics || []).map(d => ({
            problem: d.name || d.problem,
            description: d.description,
            status: d.status
          })),
          bpHistory: (found.diagnosis_history || []).map(h => ({
            date: `${h.month || ""}-${h.year || ""}`,
            systolic: h.blood_pressure?.systolic?.value ?? null,
            diastolic: h.blood_pressure?.diastolic?.value ?? null
          })).reverse()
        };
      })() ) ];
    }

    return [mockPatient];
  } catch (err) {
    console.error("Error fetching all patients:", err);
    return [mockPatient];
  }
}

function showDetails() {
  const blocks = [
    document.getElementById("contactBlock"),
    document.getElementById("emergencyBlock"),
    document.getElementById("insuranceBlock")
  ].filter(Boolean);

  if (blocks.length === 0) return;

  const currentlyHidden = getComputedStyle(blocks[0]).display === "none";
  blocks.forEach(b => {
    b.style.display = currentlyHidden ? "" : "none";
  });

  if (showAllBtn) {
    showAllBtn.textContent = currentlyHidden ? "Hide Information" : "Show All Information";
  }
}

// Initialize app
async function init() {
  const patients = await fetchAllPatients();
  renderPatientList(patients);

  // Fetch from API then populate UI
  const jessica = patients.find(p => p.name === "Jessica Taylor") || patients[0] || mockPatient;
  populateUI(jessica);
}

init();
