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
// FILE INGESTION
// ==================================================
function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "csv") {
    Papa.parse(file, {
      header:false,
      skipEmptyLines:true,
      complete: r => processRows(r.data)
    });
  } else {
    readExcelFile(file);
  }
}

function readExcelFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    const wb = XLSX.read(new Uint8Array(e.target.result), {type:"array"});
    const ws = wb.Sheets[wb.SheetNames[0]];
    processRows(XLSX.utils.sheet_to_json(ws,{header:1,blankrows:false}));
  };
  reader.readAsArrayBuffer(file);
}

// ==================================================
// MAIN FLOW
// ==================================================
function processRows(rows) {
  rawRows = rows;
  columnHeaders = buildHeaders(rows);

  if (isAlreadyValid(rows)) {
    showStatus(`✅ File already valid (${rows.length-1} rows)`, "success");
    formatCanonical(rows);
  } else {
    showStatus("ℹ️ Column mapping required", "info");
    showMappingUI();
  }
}

// ==================================================
// MAPPING UI
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

    columnHeaders.forEach((h, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = h;
      select.appendChild(opt);
    });

    select.onchange = () => columnMapping[field] = select.value === "" ? null : parseInt(select.value);

    row.appendChild(label);
    row.appendChild(select);
    table.appendChild(row);
  });
}

// ==================================================
// GENERATE FROM MAPPING
// ==================================================
function generateFromMapping() {
  if (columnMapping.StockNumber === null) {
    alert("StockNumber is required.");
    return;
  }

  const output = [];
  output.push(["StockNumber","Make","Model","Year","ExtColor","","IntColor","VIN"]);

  rawRows.slice(1).forEach(row => {
    const out = new Array(8).fill("");

    out[0] = row[columnMapping.StockNumber] || "";
    out[1] = getMapped(row,"Make");
    out[2] = getMapped(row,"Model");
    out[3] = getMapped(row,"Year");
    out[4] = getMapped(row,"ExtColor");
    out[6] = getMapped(row,"IntColor");
    out[7] = extractVin(getMapped(row,"VIN"));

    output.push(out);
  });

  showStatus(`✅ Formatted via column mapping (${output.length-1} rows)`, "success");
  downloadCSV(output);
}

function getMapped(row, field) {
  const idx = columnMapping[field];
  return idx !== null ? row[idx] : "";
}

// ==================================================
// HELPERS
// ==================================================
function buildHeaders(rows) {
  return rows[0].map((h,i) =>
    h && h.toString().trim() !== "" ? h : `Column ${i+1}`
  );
}

function extractVin(val) {
  if (!val) return "";
  const v = val.toString().trim();
  return v.length >= MIN_VIN_LENGTH ? v : "";
}

function isAlreadyValid(rows) {
  const h = rows[0];
  return EXPECTED_HEADERS.every((e,i)=>{
    if (e==="") return true;
    return (h[i]||"").toString().trim().toLowerCase()===e;
  });
}

// ==================================================
// STATUS + CSV
// ==================================================
function showStatus(msg,type){
  const area=document.getElementById("mappingArea");
  area.innerHTML=`<p class="${type}">${msg}</p>`;
}

function downloadCSV(data){
  const csv=Papa.unparse(data);
  const b=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(b);
  a.download="formatted_inventory.csv";
  a.click();
}
