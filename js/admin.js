let sessionPassword = "";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("password").value;
  const loginStatus = document.getElementById("loginStatus");
  loginStatus.textContent = "പരിശോധിക്കുന്നു...";
  loginStatus.className = "status";

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=verifyLogin&password=${encodeURIComponent(password)}`);
    const data = await res.json();
    if (data.success) {
      sessionPassword = password;
      document.getElementById("loginForm").classList.add("hidden");
      document.getElementById("reportSection").classList.remove("hidden");
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      document.getElementById("reportDate").value = today;
    } else {
      loginStatus.textContent = "പാസ്‌വേഡ് തെറ്റാണ്";
      loginStatus.className = "status error";
    }
  } catch (err) {
    loginStatus.textContent = "നെറ്റ്‌വർക്ക് പിശക്";
    loginStatus.className = "status error";
  }
});

document.getElementById("generateBtn").addEventListener("click", async () => {
  const date = document.getElementById("reportDate").value;
  const reportStatus = document.getElementById("reportStatus");
  const btn = document.getElementById("generateBtn");

  if (!date) { reportStatus.textContent = "തിയ്യതി തിരഞ്ഞെടുക്കുക"; reportStatus.className = "status error"; return; }

  btn.disabled = true;
  reportStatus.textContent = "റിപ്പോർട്ട് തയ്യാറാക്കുന്നു...";
  reportStatus.className = "status";

  try {
    const url = `${APPS_SCRIPT_URL}?action=report&date=${encodeURIComponent(date)}&password=${encodeURIComponent(sessionPassword)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      reportStatus.textContent = data.error || "പിശക് സംഭവിച്ചു";
      reportStatus.className = "status error";
      return;
    }

    const byteChars = atob(data.pdfBase64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = data.filename || `yuvadhara_report_${date}.pdf`;
    link.click();

    reportStatus.textContent = "റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്തു ✓";
    reportStatus.className = "status success";
  } catch (err) {
    reportStatus.textContent = "നെറ്റ്‌വർക്ക് പിശക്";
    reportStatus.className = "status error";
  } finally {
    btn.disabled = false;
  }
});
