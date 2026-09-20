# Yuvadhara Daily Progress Tool — DYFI Valanchery Block Committee

## 1. Google Sheet
Create a new Google Sheet. Copy its ID from the URL
(`https://docs.google.com/spreadsheets/d/<THIS_PART>/edit`).

## 2. Apps Script backend
1. In the Sheet: Extensions > Apps Script.
2. Replace the default `Code.gs` content with `apps-script/Code.gs` from this repo.
3. Replace `appsscript.json` (View > Show manifest file) with `apps-script/appsscript.json`.
4. Set `SHEET_ID` at the top of `Code.gs` to your Sheet ID.
5. Project Settings > Script Properties > add `ADMIN_PASSWORD` = your chosen admin password.
6. Deploy > New deployment > type "Web app":
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the deployment URL (ends in `/exec`).

## 3. Frontend (this repo)
1. Put the Anek Malayalam font file at `fonts/AnekMalayalam-Regular.ttf`.
2. In `js/config.js`, paste your Apps Script URL into `APPS_SCRIPT_URL`.
3. Push this repo to GitHub, enable GitHub Pages (Settings > Pages > branch `main`, root).
4. `index.html` is the daily entry form; `admin.html` is the report generator.

## Notes
- Date is auto-set server-side using IST — no manual selection.
- "ആകെ ചേർത്തത്" is a running sum of daily entries up to the selected report date.
- "പണം ലഭിച്ചത്" is treated as a cumulative figure re-entered daily; the report uses the latest value on/before the selected date (not a sum). Adjust `handleReport()` if you intended something else.
- The PDF report uses "Anek Malayalam" as a native Google Docs font — Google Docs pulls this from Google Fonts automatically, no upload needed.
- Repo structure:
```
index.html
admin.html
css/style.css
js/config.js
js/app.js
js/admin.js
fonts/AnekMalayalam-Regular.ttf
apps-script/Code.gs
apps-script/appsscript.json
```
