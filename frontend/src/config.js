// ERPNext API Tester Configuration

export const CONFIG = {
  // ERPNext API Configuration
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || '',
  
  // Default base URL examples
  DEFAULT_BASE_URLS: [
    'http://localhost:8000',
    'https://your-erpnext-instance.com',
    'https://demo.erpnext.com'
  ],
  
  // API Endpoints
  ENDPOINTS: {
    DOCTYPES: '/api/method/frappe.desk.doctype.data_import_tool.data_import_tool.get_doctypes',
    RESOURCE: '/api/resource'
  },
  
  // Default Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    API_KEY: 'erpnext-api-key',
    API_SECRET: 'erpnext-api-secret',
    BASE_URL: 'erpnext-base-url',
    RECENT_REQUESTS: 'erpnext-recent-requests'
  },
  
  // UI Configuration
  UI: {
    MAX_RECENT_REQUESTS: 20,
    JSON_VIEWER_THEME: 'rjv-default',
    RESPONSE_VIEWER_HEIGHT: '400px'
  },
  
  // HTTP Methods
  HTTP_METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
  
  // Common ERPNext Doctypes (fallback if API fails)
  COMMON_DOCTYPES: [
    // 🔑 Core Doctypes
    'User',
    'Role',
    'DocType',
    'File',
    'Tag',
    'Version',
    'ToDo',
    
    // 📦 Stock & Inventory
    'Item',
    'Item Group',
    'Item Price',
    'Batch',
    'Serial No',
    'Stock Entry',
    'Stock Ledger Entry',
    'Stock Reconciliation',
    'Delivery Note',
    'Purchase Receipt',
    'Warehouse',
    
    // 💰 Accounts
    'Customer',
    'Supplier',
    'Sales Invoice',
    'Purchase Invoice',
    'Journal Entry',
    'Payment Entry',
    'Payment Request',
    'Bank Account',
    'Bank Transaction',
    'Pricing Rule',
    'Tax Category',
    
    // 🛒 Selling
    'Quotation',
    'Sales Order',
    'Customer Group',
    'Territory',
    'Lead',
    'Opportunity',
    
    // 📥 Buying
    'Supplier Group',
    'Supplier Quotation',
    'Purchase Order',
    
    // 🏭 Manufacturing
    'BOM',
    'Work Order',
    'Job Card',
    'Routing',
    'Production Plan',
    
    // 👷 HR & Payroll
    'Employee',
    'Department',
    'Designation',
    'Attendance',
    'Leave Application',
    'Leave Type',
    'Salary Structure',
    'Salary Slip',
    'Expense Claim',
    
    // 📊 Projects
    'Project',
    'Task',
    'Timesheet',
    'Activity Cost',
    
    // 🏢 CRM
    'Campaign',
    'Contact',
    
    // ⚙️ Website / Portal
    'Web Page',
    'Blog Post',
    'Blog Category',
    'Web Form',
    'Web Template',
    
    // Additional Common Doctypes
    'Permission',
    'Workflow',
    'Custom Field',
    'Print Format',
    'Letter Head',
    'Address',
    'Contact',
    'Communication',
    'Email Queue',
    'Error Log',
    'Scheduled Job Type',
    'Scheduled Job Log',
    'System Settings',
    'Global Defaults',
    'Company',
    'Fiscal Year',
    'Cost Center',
    'Account',
    'Party Type',
    'UOM',
    'Brand',
    'Item Attribute',
    'Item Attribute Value',
    'Price List',
    'Shipping Rule',
    'Sales Taxes and Charges Template',
    'Purchase Taxes and Charges Template',
    'Sales Person',
    'Sales Team',
    'Sales Partner',
    'Campaign',
    'Appointment',
    'Patient',
    'Patient Appointment',
    'Patient Encounter',
    'Vital Signs',
    'Clinical Procedure',
    'Lab Test',
    'Lab Test Template',
    'Sample Collection',
    'Sample',
    'Lab Test Sample',
    'Lab Test UOM',
    'Lab Test Normal Range',
    'Lab Test Group',
    'Lab Test Name',
    'Lab Test Unit',
    'Lab Test Template',
    'Lab Test',
    'Sample Collection',
    'Sample',
    'Lab Test Sample',
    'Lab Test UOM',
    'Lab Test Normal Range',
    'Lab Test Group',
    'Lab Test Name',
    'Lab Test Unit'
  ]
};

export default CONFIG;
