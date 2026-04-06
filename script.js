// ==================================================
// CANONICAL SCHEMA
// ==================================================
const EXPECTED_HEADERS = [
  "stocknumber","make","model","year","extcolor","","intcolor","vin"
];

const CANONICAL_FIELDS = [
  "StockNumber","Make","Model","Year","ExtColor","IntColor","VIN"
];

const EXPECTED_COL_COUNT = 8;
const MIN_VIN_LENGTH = 7;

let rawRows = [];
let columnHeaders = [];
let columnMapping = {};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fileInput").addEventListener("change", handleFile);
  document.getElementById("generateFromMappingBtn")
    .addEventListener("click", generateFromMapping);
});

// ==================================================
// FILE INGESTION (CSV + EXCEL)
// ==================================================
function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "csv") {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: r => processRows(r.data)
    });
  } else if (ext === "xls" || ext === "xlsx") {
    readExcelFile(file);
  } else {
    showStatus("❌ Unsupported file type.", "error");
  }
}

function readExcelFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const workbook = XLSX.read(
      new Uint8Array(e.target.result),
      { type: "array" }
    );
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false
    });
    processRows(rows);
  };
  reader.readAsArrayBuffer(file);
}

// ==================================================
// MAIN FLOW
// ==================================================
function processRows(rows) {
  rawRows = rows;
  columnHeaders = buildHeaders(rows);

  const rowCount = rows.length - 1;

  if (!hasValidStockNumbers(rows)) {
    showStatus(
      `❌ StockNumber is required for import.
(${rowCount} rows processed)`,
      "error"
    );
    return;
  }

  // ✅ Already canonical → still FORCE CSV generation
  if (isAlreadyValid(rows)) {
    showStatus(
      `✅ This file already matches the required import format.
(${rowCount} rows processed)`,
      "success"
    );
    formatCanonical(rows);
    return;
  }

  // ❌ Not canonical → show mapping UI
  showStatus(
    `ℹ️ Column mapping required.
(${rowCount} rows detected)`,
    "info"
  );
  showMappingUI();
}

// ==================================================
// COLUMN MAPPING UI
// ==================================================
function showMappingUI() {
  const ui = document.getElementById("mappingUI");
  const table = document.getElementById("mappingTable");

  table.innerHTML = "";
  ui.style.display = "block";
  columnMapping = {};

  CANONICAL_FIELDS.forEach(field => {
    columnMapping[field] = null;

    const row = document.createElement("div");
    row.style.marginBottom = "8px";

    const label = document.createElement("label");
    label.textContent = field + (field === "StockNumber" ? " *" : "");
    label.style.display = "inline-block";
    label.style.width = "140px";

    const select = document.createElement("select");
    select.innerHTML = `<option value="">-- Select Column --</option>`;

    columnHeaders.forEach((header, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = header;
      select.appendChild(opt);
    });

    select.onchange = () =>
      columnMapping[field] = select.value === "" ? null : parseInt(select.value);

    row.appendChild(label);
    row.appendChild(select);
    table.appendChild(row);
  });
}

// ==================================================
// GENERATE CSV FROM MAPPING
// ==================================================
function generateFromMapping() {
  if (columnMapping.StockNumber === null) {
    alert("StockNumber mapping is required.");
    return;
  }

  const output = [];
  output.push([
    "StockNumber","Make","Model","Year","ExtColor","","IntColor","VIN"
  ]);

  rawRows.slice(1).forEach(row => {
    const out = new Array(8).fill("");

    out[0] = getMapped(row,"StockNumber");
    out[1] = getMapped(row,"Make");
    out[2] = getMapped(row,"Model");
    out[3] = getMapped(row,"Year");
    out[4] = getMapped(row,"ExtColor");
    out[6] = getMapped(row,"IntColor");
    out[7] = extractVin(getMapped(row,"VIN"));

    output.push(out);
  });

  showStatus(
    `✅ Formatted via column mapping.
(${output.length - 1} rows processed)`,
    "success"
  );

  downloadCSV(output);
}

function getMapped(row, field) {
  const idx = columnMapping[field];
  return idx !== null && row[idx] !== undefined ? row[idx] : "";
}

// ==================================================
// CANONICAL FORMAT (ALREADY VALID FILES)
// ==================================================
function formatCanonical(rows) {
  const output = [];

  output.push([
    "StockNumber","Make","Model","Year","ExtColor","","IntColor","VIN"
  ]);

  rows.forEach((row, index) => {
    if (
      index === 0 &&
      row[0]?.toString().toLowerCase().trim() === "stocknumber"
    ) {
      return;
    }

    const out = new Array(8).fill("");

    out[0] = row[0] || "";
    out[1] = row[1] || "";
    out[2] = row[2] || "";
    out[3] = row[3] || "";
    out[4] = row[4] || "";
    out[6] = row[6] || "";
    out[7] = extractVin(row[row.length - 1]);

    output.push(out);
  });

  downloadCSV(output);
}

// ==================================================
// VALIDATION HELPERS
// ==================================================
function hasValidStockNumbers(rows) {
  return rows.slice(1).every(
    row => row[0] && row[0].toString().trim() !== ""
  );
}

function isAlreadyValid(rows) {
  const h = rows[0];
  if (!h || h.length < EXPECTED_COL_COUNT) return false;

  return EXPECTED_HEADERS.every((exp, i) => {
    if (exp === "") return true;
    return (h[i] || "")
      .toString()
      .trim()
      .toLowerCase() === exp;
  });
}

function buildHeaders(rows) {
  return rows[0].map((h, i) =>
    h && h.toString().trim() !== "" ? h : `Column ${i + 1}`
  );
}

// ==================================================
// VIN HANDLING
// ==================================================
function extractVin(val) {
  if (!val) return "";
  const vin = val.toString().trim();
  return vin.length >= MIN_VIN_LENGTH ? vin : "";
}

// ==================================================
// STATUS + CSV OUTPUT
// ==================================================
function showStatus(message, type) {
  const area = document.getElementById("mappingArea");
  area.innerHTML = `<p class="${type}">${message}</p>`;
}

function downloadCSV(data) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "formatted_inventory.csv";
  link.click();
}
