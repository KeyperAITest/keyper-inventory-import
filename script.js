// ==================================================
// HARD-FIXED FORMAT FOR BASIC ASSET IMPORT
// ==================================================
const EXPECTED_COLS = 8;

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fileInput").addEventListener("change", handleFile);
});

function handleFile(event) {
  const file = event.target.files[0];

  Papa.parse(file, {
    header: false,
    skipEmptyLines: true,
    complete: (results) => {
      const output = [];

      // Header row (for visibility)
      output.push([
        "StockNumber",
        "Make",
        "Model",
        "Year",
        "ExtColor",
        "",
        "IntColor",
        "VIN"
      ]);

      results.data.forEach(row => {
        const normalized = new Array(EXPECTED_COLS).fill("");

        // Force known positions
        normalized[0] = row[0] || ""; // StockNumber
        normalized[1] = row[1] || ""; // Make
        normalized[2] = row[2] || ""; // Model
        normalized[3] = row[3] || ""; // Year

        // VIN is ALWAYS last value in your files
        normalized[7] = row[row.length - 1] || "";

        output.push(normalized);
      });

      downloadCSV(output);
    }
  });
}

function downloadCSV(data) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "formatted_inventory.csv";
  link.click();
}
``
