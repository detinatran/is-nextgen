// Shared CSV Export Utility for Admin Dashboard
// RFC 4180 compliant CSV generation with proper escaping

export interface CSVColumn {
  header: string;
  key: string;
  render?: (row: any) => string;
}

export interface CSVExportOptions {
  filename: string;
  columns: CSVColumn[];
  data: any[];
  bom?: boolean; // Add UTF-8 BOM for Excel compatibility
}

/**
 * Escape a value for CSV according to RFC 4180
 * - Wrap in double quotes if contains comma, newline, or double quote
 * - Escape double quotes by doubling them
 */
export function escapeCSVValue(value: string): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuotes = /[",\n\r]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

/**
 * Generate CSV content as string
 */
export function generateCSVString(columns: CSVColumn[], data: any[]): string {
  const headers = columns.map((col) => escapeCSVValue(col.header));
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = col.render ? col.render(row) : row[col.key];
      return escapeCSVValue(value);
    })
  );
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Download CSV file using Blob (avoids data URI encoding issues)
 */
export function downloadCSV(csvString: string, filename: string, addBOM = true): void {
  const blob = new Blob([addBOM ? "﻿" : "", csvString], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Full CSV export pipeline
 */
export function exportCSV(options: CSVExportOptions): void {
  const csvString = generateCSVString(options.columns, options.data);
  downloadCSV(csvString, options.filename, options.bom ?? true);
}

/**
 * Format date for CSV export using locale-aware formatting
 */
export function formatDateForCSV(dateString: string, locale: "vi-VN" | "en-US" = "vi-VN"): string {
  try {
    return new Date(dateString).toLocaleDateString(locale);
  } catch {
    return dateString;
  }
}

/**
 * Format datetime for CSV export
 */
export function formatDateTimeForCSV(dateString: string, locale: "vi-VN" | "en-US" = "vi-VN"): string {
  try {
    return new Date(dateString).toLocaleString(locale);
  } catch {
    return dateString;
  }
}