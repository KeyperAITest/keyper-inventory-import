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

document.addEventListener("DOMContentLoaded", function () {
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
    complete: function (results) {
      sourceRows = results.data;

      // Build generic column labels based on column count
      const columnLabels = sourceRows[0].map(function (_, idx) {
        return "Column " + (idx + 1);
      });

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

  OUTPUT_SCHEMA.forEach(function (field) {

    // Locked system-required blank columns
    if (field.type === "blank") {
      container.innerHTML +=
        "<p><strong>" + field.key + "</strong>: (system-required blank column)</p>";
      return;
    }

    const select = document.createElement("select");
    select.innerHTML = '<option value="">-- Select Column --</option>';

    columnLabels.forEach(function (label, idx) {
      const option = document.createElement("option");
      option.value = idx;
      option.textContent = label;
      select.appendChild(option);
    });

    select.addEventListener("change", function (e) {
      mappings[field.key] = parseInt(e.target.value, 10);
    });

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
  const EXPECTED_COLS = OUTPUT_SCHEMA.length;

  // Header row (for visibility; system can ignore if needed)
  output.push(
    OUTPUT_SCHEMA.map(function (f) {
      return f.type === "blank" ? "" : f.key;
    })
  );

  sourceRows.forEach(function (row) {
    // Pad row so missing commas don't collapse positions
    const paddedRow = row.slice();
    while (paddedRow.length < EXPECTED_COLS) {
      paddedRow.push("");
    }

    const outRow = [];

    OUTPUT_SCHEMA.forEach(function (field) {
      if (field.type === "blank") {
        outRow.push("");
      } else {
        const srcIndex = mappings[field.key];
        outRow.push(
          srcIndex !== undefined && paddedRow[srcIndex] !== undefined
            ? paddedRow[srcIndex]
            : ""
        );
      }
    });

    output.push(outRow);
  });

  const csv = Papa.unparse(output);
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "formatted_inventory.csv";
  link.click();
}
