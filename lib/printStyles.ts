// Enhanced print styling utilities for invoice and receipt printing
export const addPrintStyles = () => {
  // Remove existing print styles to avoid conflicts
  const existingPrintStyle = document.getElementById('print-styles');
  if (existingPrintStyle) {
    existingPrintStyle.remove();
  }

  const printStyles = document.createElement('style');
  printStyles.id = 'print-styles';
  printStyles.innerHTML = `
    @media print {
      /* Reset all margins and padding for print */
      * {
        box-sizing: border-box;
      }
      
      body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: 'Arial', 'Helvetica', sans-serif !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
        color: #000 !important;
        background: white !important;
      }
      
      /* Hide non-printable elements */
      .non-printable, 
      .no-print,
      button:not(.print-button),
      nav,
      .navbar,
      .sidebar,
      .modal-backdrop,
      .modal-header,
      .modal-footer,
      .dropdown,
      .tooltip,
      .popover {
        display: none !important;
      }
      
      /* Show only printable content */
      .printable-area,
      .printable-content {
        display: block !important;
        margin: 0 !important;
        padding: 20px !important;
        width: 100% !important;
        max-width: none !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        border: none !important;
        box-shadow: none !important;
        background: white !important;
      }
      
      /* Invoice/Receipt specific styling */
      .invoice-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #000;
        padding-bottom: 20px;
      }
      
      .invoice-title {
        font-size: 24px !important;
        font-weight: bold !important;
        margin-bottom: 10px;
        text-transform: uppercase;
      }
      
      .company-info {
        font-size: 14px !important;
        margin-bottom: 20px;
      }
      
      .client-info,
      .invoice-details {
        margin-bottom: 20px;
        padding: 10px;
        border: 1px solid #ccc;
      }
      
      .invoice-table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: 20px 0 !important;
      }
      
      .invoice-table th,
      .invoice-table td {
        border: 1px solid #000 !important;
        padding: 8px !important;
        text-align: left !important;
        font-size: 12px !important;
      }
      
      .invoice-table th {
        background-color: #f5f5f5 !important;
        font-weight: bold !important;
        text-align: center !important;
      }
      
      .invoice-table .text-right {
        text-align: right !important;
      }
      
      .total-section {
        margin-top: 20px;
        border-top: 2px solid #000;
        padding-top: 10px;
      }
      
      .total-row {
        font-weight: bold !important;
        font-size: 14px !important;
      }
      
      .signature-section {
        margin-top: 40px;
        display: flex;
        justify-content: space-between;
      }
      
      .signature-box {
        width: 200px;
        height: 80px;
        border: 1px solid #000;
        text-align: center;
        padding-top: 60px;
        font-size: 12px;
      }
      
      /* Payment slip specific */
      .payment-slip {
        border: 2px solid #000;
        padding: 20px;
        margin: 20px 0;
      }
      
      .payment-slip-header {
        text-align: center;
        border-bottom: 1px solid #000;
        padding-bottom: 15px;
        margin-bottom: 15px;
      }
      
      .payment-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .payment-amount {
        font-size: 18px !important;
        font-weight: bold !important;
        text-align: center;
        border: 2px solid #000;
        padding: 10px;
        margin: 20px 0;
      }
      
      /* Force page breaks */
      .page-break {
        page-break-before: always;
      }
      
      .avoid-break {
        page-break-inside: avoid;
      }
      
      /* Currency formatting */
      .currency {
        font-weight: bold;
      }
      
      /* Date formatting */
      .date {
        font-style: italic;
      }
      
      /* Remove shadows and fancy styling for print */
      .shadow,
      .shadow-lg,
      .shadow-md,
      .shadow-sm {
        box-shadow: none !important;
      }
      
      .rounded,
      .rounded-lg,
      .rounded-md {
        border-radius: 0 !important;
      }
      
      /* Ensure proper spacing */
      p, div {
        margin-bottom: 8px;
      }
      
      h1, h2, h3, h4, h5, h6 {
        margin-top: 20px;
        margin-bottom: 10px;
        font-weight: bold;
      }
      
      /* Print background colors */
      .print-bg-gray {
        background-color: #f5f5f5 !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
      
      .print-bg-slate {
        background-color: #e2e8f0 !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  `;
  
  document.head.appendChild(printStyles);
};

export const preparePrintDocument = (elementId?: string) => {
  // Add print styles
  addPrintStyles();
  
  // If specific element ID is provided, focus on that element
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      // Hide everything else temporarily
      const body = document.body;
      const originalDisplay = body.style.display;
      const originalVisibility = body.style.visibility;
      
      // Create a temporary container for print content
      const printContainer = document.createElement('div');
      printContainer.className = 'printable-area';
      printContainer.innerHTML = element.innerHTML;
      
      // Replace body content temporarily
      const originalContent = body.innerHTML;
      body.innerHTML = '';
      body.appendChild(printContainer);
      
      // Print
      window.print();
      
      // Restore original content
      setTimeout(() => {
        body.innerHTML = originalContent;
        body.style.display = originalDisplay;
        body.style.visibility = originalVisibility;
      }, 100);
      
      return;
    }
  }
  
  // Default print behavior
  window.print();
};

export const removePrintStyles = () => {
  const printStyles = document.getElementById('print-styles');
  if (printStyles) {
    printStyles.remove();
  }
};