import * as XLSX from 'xlsx';

/**
 * Exports raw product data with nested data field to Excel.
 * @param {Array} data - The raw product data array from API
 * @param {string} filename - The desired filename
 */
export const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }

  const flattenedData = data.map((entry) => ({
    timestamp: entry.timestamp,
    ...entry.data,
  }));

  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "SensorData");

  XLSX.writeFile(workbook, filename);
};
