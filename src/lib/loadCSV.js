import Papa from "papaparse";

// Load CSV from public folder
export async function loadCSVFile(path) {
  try {
    const response = await fetch(path);
    const text = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: (error) => reject(error),
      });
    });
  } catch (error) {
    console.error("Error loading CSV:", error);
    throw error;
  }
}
