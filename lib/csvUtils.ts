// Enhanced CSV utilities for proper formatting and export
export interface CSVConfig {
  headers: string[];
  data: (string | number | boolean | null | undefined)[][];
  filename: string;
  includeTimestamp?: boolean;
  includeHeaders?: boolean;
}

export const formatCSVField = (field: string | number | boolean | null | undefined): string => {
  if (field === null || field === undefined) {
    return '';
  }
  
  const str = String(field);
  
  // Handle special characters that need escaping
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
};

export const downloadCSV = (config: CSVConfig): void => {
  const { headers, data, filename, includeTimestamp = true, includeHeaders = true } = config;
  
  const csvRows: string[] = [];
  
  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  
  // Add headers if required
  if (includeHeaders && headers.length > 0) {
    csvRows.push(headers.map(formatCSVField).join(','));
  }
  
  // Add data rows
  data.forEach(row => {
    const formattedRow = row.map(formatCSVField).join(',');
    csvRows.push(formattedRow);
  });
  
  // Create CSV content with BOM
  const csvContent = BOM + csvRows.join('\r\n');
  
  // Generate filename with timestamp if required
  const timestamp = includeTimestamp 
    ? `_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '-')}`
    : '';
  const finalFilename = filename.endsWith('.csv') 
    ? filename.replace('.csv', `${timestamp}.csv`)
    : `${filename}${timestamp}.csv`;
  
  // Create and download the file
  const blob = new Blob([csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
};

// Helper functions for common data types
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
};

export const formatBoolean = (value: boolean | undefined): string => {
  if (value === undefined) return '';
  return value ? 'Ya' : 'Tidak';
};