const MALAYALAM_MONTHS = [
  "ജനുവരി","ഫെബ്രുവരി","മാർച്ച്","ഏപ്രിൽ","മേയ്","ജൂൺ",
  "ജൂലൈ","ഓഗസ്റ്റ്","സെപ്റ്റംബർ","ഒക്ടോബർ","നവംബർ","ഡിസംബർ"
];

function getISTParts() {
  const now = new Date();
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const ist = new Date(istString);
  return { year: ist.getFullYear(), month: ist.getMonth(), day: ist.getDate() };
}

function displayToday() {
  const { year, month, day } = getISTParts();
  document.getElementById("todayDate").textContent =
    `${year} ${MALAYALAM_MONTHS[month]} ${day}`;
}

async function loadCommittees() {
  const select = document.getElementById("committee");
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=committees`);
    const data = await res.json();
    data.committees.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

function setStatus(msg, type) {
  const el = document.getElementById("statusMsg");
  el.textContent = msg;
  el.className = "status " + (type || "");
}

document.getElementById("entryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitBtn");
  const committee = document.getElementById("committee").value;
  const todayAdded = document.getElementById("todayAdded").value;
  const moneyReceived = document.getElementById("moneyReceived").value;

  if (!committee) { setStatus("മേഖലാ കമ്മിറ്റി തിരഞ്ഞെടുക്കുക", "error"); return; }

  btn.disabled = true;
  setStatus("സമർപ്പിക്കുന്നു...", "");

  const url = `${APPS_SCRIPT_URL}?action=submit`
    + `&committee=${encodeURIComponent(committee)}`
    + `&todayAdded=${encodeURIComponent(todayAdded)}`
    + `&moneyReceived=${encodeURIComponent(moneyReceived)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      setStatus("വിജയകരമായി സമർപ്പിച്ചു ✓", "success");
      document.getElementById("entryForm").reset();
      displayToday();
    } else {
      setStatus(data.error || "പിശക് സംഭവിച്ചു", "error");
    }
  } catch (err) {
    setStatus("നെറ്റ്‌വർക്ക് പിശക്", "error");
  } finally {
    btn.disabled = false;
  }
});

displayToday();
loadCommittees();
