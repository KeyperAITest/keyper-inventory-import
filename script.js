// ==================================================
// CANONICAL FIXED OUTPUT SCHEMA (ORDER MATTERS)
// ==================================================
const OUTPUT_SCHEMA = [
  { key: "StockNumber" },
  { key: "Make" },
  { key: "Model" },
  { key: "Year" },
  { key: "ExtColor" },
  { key: "Blank1", type: "blank" },
  { key: "IntColor" },
  { key: "VIN" }
];

let sourceRows = [];
let mappings = {};

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fileInput").addEventListener("change", handleFile);
  document.getElementById("downloadBtn").addEventListener("click", generateCSV);
});

// ==================================================
// READ CSV (NO HEADERS ASSUMED)
// ==================================================
function handleFile(event) {
  const file = event.target.files[0];

  Papa.parse(file, {
    header: false,
    skipEmptyLines: true,
    complete: (results) => {
      sourceRows = results.data;

      // Generate Column 1, Column 2, etc.
      const columnLabels = sourceRows[0].map(
        (_, idx) => `Column ${idx + 1}`
      );

      buildMappingUI(columnLabels);
    }
  });
}

// ==================================================
// BUILD COLUMN MAPPING UI
// ==================================================
function buildMappingUI(columnLabels) {
  const container = document.getElementById("mappingArea");
  container.innerHTML = "<h2>Map Your Columns</h2>";
  mappings = {};

  OUTPUT_SCHEMA.forEach(field => {

    // Locked system blank columns
    if (field.type === "blank") {
      container.innerHTML +=
        `<p><strong>${field.key}</strong>: (system-required blank column)</p>`;
      return;
    }

    const select = document.createElement("select");
    select.innerHTML = `<option value="">-- Select Column --</option>`;

    columnLabels.forEach((label, idx) => {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = label;
      select.appendChild(opt);
    });

    select.onchange = e => {
      mappings[field.key] = parseInt(e.target.value, 10);
    };

    container.appendChild(document.createTextNode(field.key + ": "));
    container.appendChild(select);
    container.appendChild(document.createElement("br"));
  });

  document.getElementById("downloadBtn").disabled = false;
}

// ==================================================
// GENERATE FINAL IMPORT-READY CSV
// ==================================================
function generateCSV() {
  const output = [];

  // Header row for readability
  output.push(
    OUTPUT_SCHEMA.map(f => (f.type === "blank" ? "" : f.key))
  );

  sourceRows.forEach(row => {
    const outRow = [];

    OUTPUT_SCHEMA.forEach(field => {
      if (field.type === "blank") {
        outRow.push("");
      } else {
        const sourceIndex = mappings[field.key];
        outRow.push(
          sourceIndex !== undefined && row[sourceIndex] !== undefined
            ? row[sourceIndex]
            : ""
        );
      }
    });

    output.push(outRow);
  });

  const csv = Papa.unparse(output);
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "formatted_inventory.csv";
  a.click();
}
``
