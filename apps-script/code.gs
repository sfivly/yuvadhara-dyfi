// ===== CONFIG =====
const SHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const SHEET_NAME = "Responses";

const COMMITTEES = [
  { name: "എടയൂര്‍", quota: 200 },
  { name: "വടക്കുമ്പുറം", quota: 120 },
  { name: "വളാഞ്ചേരി", quota: 200 },
  { name: "ഇരിമ്പിളിയം", quota: 250 },
  { name: "കാവുംപുറം", quota: 150 },
  { name: "കുറ്റിപ്പുറം", quota: 250 },
  { name: "നടുവട്ടം", quota: 200 },
  { name: "ആതവനാട്", quota: 130 },
  { name: "കുറുമ്പത്തൂര്‍", quota: 130 },
  { name: "കാടാമ്പുഴ", quota: 230 },
  { name: "മാറാക്കര", quota: 150 }
];

const MALAYALAM_MONTHS = [
  "ജനുവരി","ഫെബ്രുവരി","മാർച്ച്","ഏപ്രിൽ","മേയ്","ജൂൺ",
  "ജൂലൈ","ഓഗസ്റ്റ്","സെപ്റ്റംബർ","ഒക്ടോബർ","നവംബർ","ഡിസംബർ"
];

const REPORT_FONT = "Anek Malayalam"; // Available as a Google Font inside Google Docs

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === "submit") return handleSubmit(e);
    if (action === "committees") return jsonResponse({ committees: COMMITTEES });
    if (action === "verifyLogin") return handleVerifyLogin(e);
    if (action === "report") return handleReport(e);
    return jsonResponse({ success: false, error: "Unknown action" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Date", "Committee", "TodayAdded", "MoneyReceivedTotal"]);
  }
  return sheet;
}

function getISTDateString() {
  return Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyy-MM-dd");
}

// ---- Submit daily entry ----
function handleSubmit(e) {
  const committee = e.parameter.committee;
  const todayAdded = parseInt(e.parameter.todayAdded, 10);
  const moneyReceived = parseInt(e.parameter.moneyReceived, 10);

  const valid = COMMITTEES.some(c => c.name === committee);
  if (!valid) return jsonResponse({ success: false, error: "അസാധുവായ കമ്മിറ്റി" });
  if (isNaN(todayAdded) || todayAdded < 0 || isNaN(moneyReceived) || moneyReceived < 0) {
    return jsonResponse({ success: false, error: "സാധുവായ സംഖ്യ നൽകുക" });
  }

  const sheet = getSheet();
  const dateStr = getISTDateString();
  sheet.appendRow([new Date(), dateStr, committee, todayAdded, moneyReceived]);

  return jsonResponse({ success: true });
}

// ---- Admin login check ----
function handleVerifyLogin(e) {
  const password = e.parameter.password;
  const stored = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if (password && stored && password === stored) {
    return jsonResponse({ success: true });
  }
  return jsonResponse({ success: false, error: "പാസ്‌വേഡ് തെറ്റാണ്" });
}

// ---- Generate report PDF ----
function handleReport(e) {
  const password = e.parameter.password;
  const stored = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if (!password || password !== stored) {
    return jsonResponse({ success: false, error: "അനുമതി ഇല്ല" });
  }

  const dateParam = e.parameter.date; // yyyy-MM-dd
  if (!dateParam) return jsonResponse({ success: false, error: "തിയ്യതി ആവശ്യമാണ്" });

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  values.shift(); // remove header

  // Aggregate: sum todayAdded up to date; latest moneyReceived value up to date
  const totals = {};
  COMMITTEES.forEach(c => totals[c.name] = { added: 0, money: 0, lastDate: null });

  values.forEach(row => {
    const rowDate = row[1]; // yyyy-MM-dd string
    const committee = row[2];
    const todayAdded = Number(row[3]) || 0;
    const moneyReceived = Number(row[4]) || 0;

    if (!totals[committee]) return;
    if (rowDate > dateParam) return; // only entries on/before selected date

    totals[committee].added += todayAdded;

    if (!totals[committee].lastDate || rowDate >= totals[committee].lastDate) {
      totals[committee].lastDate = rowDate;
      totals[committee].money = moneyReceived;
    }
  });

  const pdfBlob = buildReportPdf(dateParam, totals);
  const bytes = pdfBlob.getBytes();

  if (bytes.length > 1024 * 1024) {
    return jsonResponse({ success: false, error: "PDF വലിപ്പം പരിധി കവിഞ്ഞു" });
  }

  return jsonResponse({
    success: true,
    pdfBase64: Utilities.base64Encode(bytes),
    filename: `yuvadhara_report_${dateParam}.pdf`
  });
}

function buildReportPdf(dateParam, totals) {
  const parts = dateParam.split("-");
  const year = parts[0];
  const monthName = MALAYALAM_MONTHS[parseInt(parts[1], 10) - 1];
  const day = parseInt(parts[2], 10);

  const doc = DocumentApp.create("TEMP_yuvadhara_report_" + new Date().getTime());
  const body = doc.getBody();
  body.setMarginTop(30).setMarginBottom(30).setMarginLeft(40).setMarginRight(40);

  const title = body.appendParagraph("യുവധാര 2026 - 27");
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  title.editAsText().setFontFamily(REPORT_FONT).setBold(true).setFontSize(16);

  const subtitle = body.appendParagraph("DYFI വളാഞ്ചേരി ബ്ലോക്ക് കമ്മിറ്റി");
  subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  subtitle.editAsText().setFontFamily(REPORT_FONT).setBold(true).setFontSize(13);

  body.appendParagraph("");

  const dateLine = `തിയ്യതി: ${year} ${monthName} ${day}`;
  const tableData = [["ക്രമ. നം.", "മേഖലാ കമ്മിറ്റി", "ക്വാട്ട", "ആകെ ചേർത്തത്", "പണം ലഭിച്ചത്"]];

  let totalAdded = 0, totalMoney = 0, totalQuota = 0;
  COMMITTEES.forEach((c, i) => {
    const t = totals[c.name];
    tableData.push([String(i + 1), c.name, String(c.quota), String(t.added), String(t.money)]);
    totalAdded += t.added;
    totalMoney += t.money;
    totalQuota += c.quota;
  });
  tableData.push(["", "ആകെ", String(totalQuota), String(totalAdded), String(totalMoney)]);

  // Date header row spanning the table area, then the data table
  const dateTable = body.appendTable([[dateLine]]);
  styleTable(dateTable, true);

  const table = body.appendTable(tableData);
  styleTable(table, false);

  // bold header row + bold total row
  const headerRow = table.getRow(0);
  for (let c = 0; c < headerRow.getNumCells(); c++) {
    headerRow.getCell(c).editAsText().setBold(true);
  }
  const totalRow = table.getRow(table.getNumRows() - 1);
  for (let c = 0; c < totalRow.getNumCells(); c++) {
    totalRow.getCell(c).editAsText().setBold(true);
  }

  doc.saveAndClose();

  const pdfBlob = doc.getAs("application/pdf");
  DriveApp.getFileById(doc.getId()).setTrashed(true); // cleanup temp doc

  return pdfBlob;
}

function styleTable(table, centerSingle) {
  const numRows = table.getNumRows();
  for (let r = 0; r < numRows; r++) {
    const row = table.getRow(r);
    for (let c = 0; c < row.getNumCells(); c++) {
      const cell = row.getCell(c);
      cell.editAsText().setFontFamily(REPORT_FONT).setFontSize(11);
      cell.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(6).setPaddingRight(6);
      if (centerSingle) {
        cell.editAsText().setBold(true);
      }
    }
  }
}
