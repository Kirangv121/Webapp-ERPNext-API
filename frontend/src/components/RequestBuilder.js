import React, { useState, useEffect } from 'react';
import { CONFIG } from '../config';
import { getStoredBaseURL, saveBaseURL, makeApiRequest, testConnection } from '../utils/apiClient';

const RequestBuilder = ({ initialRequest, onRequest, onResponse, onNavigate }) => {
  const [method, setMethod] = useState('GET');
  const [doctype, setDoctype] = useState('');
  const [customDoctype, setCustomDoctype] = useState('');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState({});
  const [body, setBody] = useState('{}');
  const [params, setParams] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [doctypes, setDoctypes] = useState([]);
  const [showCustomDoctype, setShowCustomDoctype] = useState(false);
  const [response, setResponse] = useState(null);
  const [responseError, setResponseError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState('');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedField, setSelectedField] = useState('');
  const [loadingFields, setLoadingFields] = useState(false);
  const [customField, setCustomField] = useState('');
  const [showCustomField, setShowCustomField] = useState(false);
  const [showCurlCode, setShowCurlCode] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');

  useEffect(() => {
    if (initialRequest) {
      setMethod(initialRequest.method);
      setDoctype(initialRequest.doctype);
      setUrl(initialRequest.url);
      setBaseURL(initialRequest.baseURL || '');
      setHeaders(initialRequest.headers || {});
      setBody(initialRequest.body || '{}');
      setParams(initialRequest.params || '');
    }
    
    // Load fallback doctypes on component mount
    if (CONFIG.COMMON_DOCTYPES.length > 0) {
      setDoctypes(CONFIG.COMMON_DOCTYPES);
    }
    
    // Load saved connection details
    const savedConnection = localStorage.getItem('erpnext_connection');
    if (savedConnection) {
      try {
        const connection = JSON.parse(savedConnection);
        if (connection.connected && connection.baseURL && connection.apiKey && connection.apiSecret) {
          setBaseURL(connection.baseURL);
          setApiKey(connection.apiKey);
          setApiSecret(connection.apiSecret);
          setIsConnected(true);
          setConnectionStatus('success');
          console.log('Loaded saved connection:', connection);
        }
      } catch (err) {
        console.error('Failed to load saved connection:', err);
      }
    }
  }, [initialRequest]);

  // Fetch records when PUT or DELETE method and any doctype are selected
  useEffect(() => {
    if ((method === 'PUT' || method === 'DELETE') && doctype && isConnected) {
      fetchRecordsForDoctype(doctype);
    }
  }, [method, doctype, isConnected]);

  // Remove fetchDoctypes as it's now handled in Dashboard

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    
    // Reset selected record and field when switching methods
    setSelectedRecord('');
    setSelectedField('');
    
    // Clear request body when switching methods
    setBody('');
    
    // Generate appropriate URL based on method and doctype
    updateUrl(doctype, newMethod);
    
    // Handle method-specific logic
    if (newMethod === 'PUT' && doctype && isConnected) {
      fetchDoctypeData();
      fetchRecordsForDoctype(doctype);
      loadAvailableFields(doctype);
    } else if (newMethod === 'DELETE' && doctype && isConnected) {
      fetchRecordsForDoctype(doctype);
    } else if (newMethod === 'POST' && doctype) {
      generatePostTemplate(doctype);
    }
  };

  const testERPNextConnection = async () => {
    if (!baseURL || !apiKey || !apiSecret) {
      setConnectionError('Please provide Base URL, API Key, and API Secret');
      return;
    }

    setConnectionLoading(true);
    setConnectionError(null);
    setConnectionStatus(null);

    try {
      const result = await testConnection(baseURL, apiKey, apiSecret);
      console.log('Connection test result:', result);
      
      if (result.success) {
        setConnectionStatus('success');
        setConnectionError(null);
        setIsConnected(true);
        // Save connection details to localStorage
        localStorage.setItem('erpnext_connection', JSON.stringify({
          baseURL,
          apiKey,
          apiSecret,
          connected: true,
          timestamp: new Date().toISOString()
        }));
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error);
        setIsConnected(false);
      }
    } catch (err) {
      setConnectionStatus('error');
      setConnectionError('Connection test failed: ' + (err.message || 'Unknown error'));
      setIsConnected(false);
    } finally {
      setConnectionLoading(false);
    }
  };

  const fetchDoctypeData = async () => {
    if (!doctype || !isConnected) return;

    setLoading(true);
    setError(null);

    try {
      const requestData = {
        method: 'GET',
        doctype,
        url: `/api/resource/${doctype}`,
        baseURL,
        headers: {
          'Authorization': `token ${apiKey}:${apiSecret}`,
          'Content-Type': 'application/json'
        },
        body: '',
        params: 'limit=10' // Get multiple records to show in response
      };

      console.log('Fetching doctype data for PUT:', requestData);
      const result = await makeApiRequest(requestData);
      
      if (result.success) {
        // Show the API response (all records) in the response section
        setResponse(result.data);
        setResponseError(null);
        onResponse(result.data, null);
        
        // Create a template JSON for the request body (not the actual data)
        // Exclude 'doctype' and 'name' as they're in the URL
        const template = {
          // Add common fields based on doctype
          ...(doctype === 'Customer' && {
            customer_name: '',
            customer_type: 'Individual',
            territory: 'All Territories',
            customer_group: 'All Customer Groups',
            disabled: 0
          }),
          ...(doctype === 'Item' && {
            item_code: '',
            item_name: '',
            item_group: 'All Item Groups',
            stock_uom: 'Nos',
            is_stock_item: 1,
            disabled: 0
          }),
          ...(doctype === 'Sales Order' && {
            customer: '',
            transaction_date: new Date().toISOString().split('T')[0],
            delivery_date: new Date().toISOString().split('T')[0],
            items: []
          }),
          ...(doctype === 'User' && {
            email: '',
            first_name: '',
            last_name: '',
            enabled: 1,
            user_type: 'System User'
          })
        };
        
        // Set the template as the request body
        setBody(JSON.stringify(template, null, 2));
        console.log('Set template for PUT body:', template);
      } else {
        setError('Failed to fetch doctype data: ' + result.error);
        setResponseError(result.error);
        onResponse(null, result.error);
      }
    } catch (err) {
      setError('Failed to fetch doctype data: ' + err.message);
      setResponseError(err.message);
      onResponse(null, err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordsForDoctype = async (doctypeName) => {
    if (!isConnected || !doctypeName) return;

    setLoadingRecords(true);
    setRecords([]);
    setSelectedRecord('');

    try {
      const requestData = {
        method: 'GET',
        doctype: doctypeName,
        url: `/api/resource/${doctypeName}`,
        baseURL,
        headers: {
          'Authorization': `token ${apiKey}:${apiSecret}`,
          'Content-Type': 'application/json'
        },
        body: '',
        params: 'limit=100' // Get more records for selection
      };

      console.log(`Fetching ${doctypeName} records for PUT operation:`, requestData);
      const result = await makeApiRequest(requestData);
      
      if (result.success && result.data && result.data.data) {
        const recordList = result.data.data.map(record => {
          // Create display name based on common field patterns
          let displayName = record.name;
          
          // Try to find a better display name based on doctype
          if (doctypeName === 'Customer' && record.customer_name) {
            displayName = record.customer_name;
          } else if (doctypeName === 'Item' && record.item_name) {
            displayName = record.item_name;
          } else if (doctypeName === 'User' && record.full_name) {
            displayName = record.full_name;
          } else if (doctypeName === 'Sales Order' && record.customer) {
            displayName = `${record.customer} - ${record.name}`;
          } else if (doctypeName === 'Purchase Order' && record.supplier) {
            displayName = `${record.supplier} - ${record.name}`;
          } else if (record.title) {
            displayName = record.title;
          } else if (record.label) {
            displayName = record.label;
          }

          return {
            name: record.name,
            display_name: displayName,
            original_record: record
          };
        });
        setRecords(recordList);
        console.log(`Fetched ${doctypeName} records:`, recordList);
      } else {
        console.error(`Failed to fetch ${doctypeName} records:`, result.error);
      }
    } catch (err) {
      console.error(`Error fetching ${doctypeName} records:`, err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const getAvailableFields = (doctypeName) => {
    const fieldMappings = {
      'Customer': [
        { value: 'customer_name', label: 'Customer Name', type: 'text' },
        { value: 'customer_type', label: 'Customer Type', type: 'select', options: ['Individual', 'Company'] },
        { value: 'customer_group', label: 'Customer Group', type: 'text' },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { value: 'email_id', label: 'Email ID', type: 'email' },
        { value: 'mobile_no', label: 'Mobile Number', type: 'text' },
        { value: 'phone', label: 'Phone', type: 'text' },
        { value: 'website', label: 'Website', type: 'url' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'market_segment', label: 'Market Segment', type: 'text' },
        { value: 'industry', label: 'Industry', type: 'text' },
        { value: 'credit_limit', label: 'Credit Limit', type: 'number' },
        { value: 'credit_days', label: 'Credit Days', type: 'number' },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ],
      'Supplier': [
        { value: 'supplier_name', label: 'Supplier Name', type: 'text' },
        { value: 'supplier_type', label: 'Supplier Type', type: 'select', options: ['Individual', 'Company'] },
        { value: 'supplier_group', label: 'Supplier Group', type: 'text' },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'email_id', label: 'Email ID', type: 'email' },
        { value: 'mobile_no', label: 'Mobile Number', type: 'text' },
        { value: 'phone', label: 'Phone', type: 'text' },
        { value: 'website', label: 'Website', type: 'url' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'market_segment', label: 'Market Segment', type: 'text' },
        { value: 'industry', label: 'Industry', type: 'text' },
        { value: 'credit_limit', label: 'Credit Limit', type: 'number' },
        { value: 'credit_days', label: 'Credit Days', type: 'number' },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ],
      'Employee': [
        { value: 'employee_name', label: 'Employee Name', type: 'text' },
        { value: 'first_name', label: 'First Name', type: 'text' },
        { value: 'last_name', label: 'Last Name', type: 'text' },
        { value: 'employee_number', label: 'Employee Number', type: 'text' },
        { value: 'designation', label: 'Designation', type: 'text' },
        { value: 'department', label: 'Department', type: 'text' },
        { value: 'branch', label: 'Branch', type: 'text' },
        { value: 'company', label: 'Company', type: 'text' },
        { value: 'date_of_birth', label: 'Date of Birth', type: 'date' },
        { value: 'date_of_joining', label: 'Date of Joining', type: 'date' },
        { value: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { value: 'marital_status', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
        { value: 'email_id', label: 'Email ID', type: 'email' },
        { value: 'mobile_no', label: 'Mobile Number', type: 'text' },
        { value: 'phone', label: 'Phone', type: 'text' },
        { value: 'emergency_contact_no', label: 'Emergency Contact', type: 'text' },
        { value: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
        { value: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Suspended', 'Left'] },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ],
      'Lead': [
        { value: 'lead_name', label: 'Lead Name', type: 'text' },
        { value: 'lead_type', label: 'Lead Type', type: 'select', options: ['Individual', 'Company'] },
        { value: 'email_id', label: 'Email ID', type: 'email' },
        { value: 'mobile_no', label: 'Mobile Number', type: 'text' },
        { value: 'phone', label: 'Phone', type: 'text' },
        { value: 'company_name', label: 'Company Name', type: 'text' },
        { value: 'source', label: 'Source', type: 'text' },
        { value: 'status', label: 'Status', type: 'select', options: ['Lead', 'Open', 'Replied', 'Opportunity', 'Quotation', 'Lost Quotation', 'Interested', 'Not Interested', 'Converted'] },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'market_segment', label: 'Market Segment', type: 'text' },
        { value: 'industry', label: 'Industry', type: 'text' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'website', label: 'Website', type: 'url' },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ],
      'Opportunity': [
        { value: 'opportunity_from', label: 'Opportunity From', type: 'select', options: ['Lead', 'Customer', 'Prospect'] },
        { value: 'customer', label: 'Customer', type: 'text' },
        { value: 'lead', label: 'Lead', type: 'text' },
        { value: 'opportunity_type', label: 'Opportunity Type', type: 'select', options: ['Sales', 'Maintenance', 'Support'] },
        { value: 'source', label: 'Source', type: 'text' },
        { value: 'status', label: 'Status', type: 'select', options: ['Open', 'Replied', 'Quotation', 'Lost Quotation', 'Interested', 'Not Interested', 'Converted'] },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'market_segment', label: 'Market Segment', type: 'text' },
        { value: 'industry', type: 'text' },
        { value: 'contact_person', label: 'Contact Person', type: 'text' },
        { value: 'contact_email', label: 'Contact Email', type: 'email' },
        { value: 'contact_mobile', label: 'Contact Mobile', type: 'text' },
        { value: 'contact_display', label: 'Contact Display', type: 'text' },
        { value: 'customer_address', label: 'Customer Address', type: 'text' },
        { value: 'address_display', label: 'Address Display', type: 'text' },
        { value: 'opportunity_amount', label: 'Opportunity Amount', type: 'number' },
        { value: 'probability', label: 'Probability (%)', type: 'number' },
        { value: 'expected_closing', label: 'Expected Closing', type: 'date' },
        { value: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] },
        { value: 'conversion_rate', label: 'Conversion Rate', type: 'number' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ],
      'Quotation': [
        { value: 'quotation_to', label: 'Quotation To', type: 'select', options: ['Customer', 'Lead'] },
        { value: 'customer', label: 'Customer', type: 'text' },
        { value: 'lead', label: 'Lead', type: 'text' },
        { value: 'transaction_date', label: 'Transaction Date', type: 'date' },
        { value: 'valid_till', label: 'Valid Till', type: 'date' },
        { value: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] },
        { value: 'conversion_rate', label: 'Conversion Rate', type: 'number' },
        { value: 'selling_price_list', label: 'Selling Price List', type: 'text' },
        { value: 'price_list_currency', label: 'Price List Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] },
        { value: 'plc_conversion_rate', label: 'PLC Conversion Rate', type: 'number' },
        { value: 'ignore_pricing_rule', label: 'Ignore Pricing Rule', type: 'checkbox' },
        { value: 'set_warehouse', label: 'Set Warehouse', type: 'text' },
        { value: 'customer_address', label: 'Customer Address', type: 'text' },
        { value: 'address_display', label: 'Address Display', type: 'text' },
        { value: 'contact_person', label: 'Contact Person', type: 'text' },
        { value: 'contact_display', label: 'Contact Display', type: 'text' },
        { value: 'contact_mobile', label: 'Contact Mobile', type: 'text' },
        { value: 'contact_email', label: 'Contact Email', type: 'email' },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'customer_group', label: 'Customer Group', type: 'text' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'is_internal_customer', label: 'Is Internal Customer', type: 'checkbox' },
        { value: 'is_consolidated', label: 'Is Consolidated', type: 'checkbox' },
        { value: 'is_export', label: 'Is Export', type: 'checkbox' },
        { value: 'symbol', label: 'Symbol', type: 'text' },
        { value: 'letter_head', label: 'Letter Head', type: 'text' },
        { value: 'print_heading', label: 'Print Heading', type: 'text' },
        { value: 'group_same_items', label: 'Group Same Items', type: 'checkbox' },
        { value: 'is_fixed_asset', label: 'Is Fixed Asset', type: 'checkbox' },
        { value: 'select_print_heading', label: 'Select Print Heading', type: 'text' },
        { value: 'user_remark', label: 'User Remark', type: 'textarea' },
        { value: 'total_qty', label: 'Total Qty', type: 'number' },
        { value: 'base_total', label: 'Base Total', type: 'number' },
        { value: 'base_net_total', label: 'Base Net Total', type: 'number' },
        { value: 'total', label: 'Total', type: 'number' },
        { value: 'net_total', label: 'Net Total', type: 'number' },
        { value: 'total_taxes_and_charges', label: 'Total Taxes and Charges', type: 'number' },
        { value: 'base_total_taxes_and_charges', label: 'Base Total Taxes and Charges', type: 'number' },
        { value: 'grand_total', label: 'Grand Total', type: 'number' },
        { value: 'base_grand_total', label: 'Base Grand Total', type: 'number' },
        { value: 'round_total', label: 'Round Total', type: 'number' },
        { value: 'base_round_total', label: 'Base Round Total', type: 'number' },
        { value: 'rounded_total', label: 'Rounded Total', type: 'number' },
        { value: 'base_rounded_total', label: 'Base Rounded Total', type: 'number' },
        { value: 'discount_amount', label: 'Discount Amount', type: 'number' },
        { value: 'base_discount_amount', label: 'Base Discount Amount', type: 'number' },
        { value: 'additional_discount_percentage', label: 'Additional Discount Percentage', type: 'number' },
        { value: 'discount_percentage', label: 'Discount Percentage', type: 'number' },
        { value: 'apply_discount_on', label: 'Apply Discount On', type: 'select', options: ['Grand Total', 'Net Total'] },
        { value: 'base_discount_amount_on', label: 'Base Discount Amount On', type: 'select', options: ['Grand Total', 'Net Total'] },
        { value: 'other_charges_calculation', label: 'Other Charges Calculation', type: 'select', options: ['Manual', 'Automatic'] },
        { value: 'shipping_rule', label: 'Shipping Rule', type: 'text' },
        { value: 'shipping_address', label: 'Shipping Address', type: 'text' },
        { value: 'shipping_address_display', label: 'Shipping Address Display', type: 'text' },
        { value: 'billing_address', label: 'Billing Address', type: 'text' },
        { value: 'billing_address_display', label: 'Billing Address Display', type: 'text' },
        { value: 'customer_name', label: 'Customer Name', type: 'text' },
        { value: 'customer_territory', label: 'Customer Territory', type: 'text' },
        { value: 'customer_group', label: 'Customer Group', type: 'text' },
        { value: 'customer_type', label: 'Customer Type', type: 'select', options: ['Individual', 'Company'] },
        { value: 'customer_primary_contact', label: 'Customer Primary Contact', type: 'text' },
        { value: 'customer_primary_address', label: 'Customer Primary Address', type: 'text' },
        { value: 'customer_secondary_contact', label: 'Customer Secondary Contact', type: 'text' },
        { value: 'customer_secondary_address', label: 'Customer Secondary Address', type: 'text' },
        { value: 'customer_credit_limit', label: 'Customer Credit Limit', type: 'number' },
        { value: 'customer_credit_days', label: 'Customer Credit Days', type: 'number' },
        { value: 'customer_credit_days_based_on', label: 'Customer Credit Days Based On', type: 'select', options: ['Fixed Days', 'Last Day of Month', 'Last Day of Next Month'] },
        { value: 'customer_credit_limit_on_quotation', label: 'Customer Credit Limit On Quotation', type: 'number' },
        { value: 'customer_credit_limit_on_sales_order', label: 'Customer Credit Limit On Sales Order', type: 'number' },
        { value: 'customer_credit_limit_on_delivery_note', label: 'Customer Credit Limit On Delivery Note', type: 'number' },
        { value: 'customer_credit_limit_on_sales_invoice', label: 'Customer Credit Limit On Sales Invoice', type: 'number' },
        { value: 'customer_credit_limit_on_sales_return', label: 'Customer Credit Limit On Sales Return', type: 'number' },
        { value: 'customer_credit_limit_on_purchase_invoice', label: 'Customer Credit Limit On Purchase Invoice', type: 'number' },
        { value: 'customer_credit_limit_on_purchase_return', label: 'Customer Credit Limit On Purchase Return', type: 'number' },
        { value: 'customer_credit_limit_on_journal_entry', label: 'Customer Credit Limit On Journal Entry', type: 'number' },
        { value: 'customer_credit_limit_on_payment_entry', label: 'Customer Credit Limit On Payment Entry', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment', label: 'Customer Credit Limit On Advance Payment', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry', label: 'Customer Credit Limit On Advance Payment Entry', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_sales_invoice', label: 'Customer Credit Limit On Advance Payment Entry Against Sales Invoice', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_purchase_invoice', label: 'Customer Credit Limit On Advance Payment Entry Against Purchase Invoice', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_sales_order', label: 'Customer Credit Limit On Advance Payment Entry Against Sales Order', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_purchase_order', label: 'Customer Credit Limit On Advance Payment Entry Against Purchase Order', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_delivery_note', label: 'Customer Credit Limit On Advance Payment Entry Against Delivery Note', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_purchase_receipt', label: 'Customer Credit Limit On Advance Payment Entry Against Purchase Receipt', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_sales_return', label: 'Customer Credit Limit On Advance Payment Entry Against Sales Return', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_purchase_return', label: 'Customer Credit Limit On Advance Payment Entry Against Purchase Return', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_journal_entry', label: 'Customer Credit Limit On Advance Payment Entry Against Journal Entry', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_payment_entry', label: 'Customer Credit Limit On Advance Payment Entry Against Payment Entry', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_advance_payment', label: 'Customer Credit Limit On Advance Payment Entry Against Advance Payment', type: 'number' },
        { value: 'customer_credit_limit_on_advance_payment_entry_against_advance_payment_entry', label: 'Customer Credit Limit On Advance Payment Entry Against Advance Payment Entry', type: 'number' },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ],
      'Item': [
        { value: 'item_code', label: 'Item Code', type: 'text' },
        { value: 'item_name', label: 'Item Name', type: 'text' },
        { value: 'item_group', label: 'Item Group', type: 'text' },
        { value: 'stock_uom', label: 'Stock UOM', type: 'text' },
        { value: 'is_stock_item', label: 'Is Stock Item', type: 'checkbox' },
        { value: 'is_sales_item', label: 'Is Sales Item', type: 'checkbox' },
        { value: 'is_purchase_item', label: 'Is Purchase Item', type: 'checkbox' },
        { value: 'is_manufactured_item', label: 'Is Manufactured Item', type: 'checkbox' },
        { value: 'is_fixed_asset', label: 'Is Fixed Asset', type: 'checkbox' },
        { value: 'standard_rate', label: 'Standard Rate', type: 'number' },
        { value: 'valuation_rate', label: 'Valuation Rate', type: 'number' },
        { value: 'last_purchase_rate', label: 'Last Purchase Rate', type: 'number' },
        { value: 'min_order_qty', label: 'Min Order Qty', type: 'number' },
        { value: 'safety_stock', label: 'Safety Stock', type: 'number' },
        { value: 'reorder_level', label: 'Reorder Level', type: 'number' },
        { value: 'reorder_qty', label: 'Reorder Qty', type: 'number' },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ],
      'Bank': [
        { value: 'bank_name', label: 'Bank Name', type: 'text' },
        { value: 'bank_code', label: 'Bank Code', type: 'text' },
        { value: 'bank_type', label: 'Bank Type', type: 'select', options: ['Bank', 'Credit Union', 'Investment Bank'] },
        { value: 'bank_account_no', label: 'Account Number', type: 'text' },
        { value: 'bank_account_name', label: 'Account Name', type: 'text' },
        { value: 'bank_branch', label: 'Branch', type: 'text' },
        { value: 'bank_address', label: 'Address', type: 'text' },
        { value: 'bank_city', label: 'City', type: 'text' },
        { value: 'bank_state', label: 'State', type: 'text' },
        { value: 'bank_country', label: 'Country', type: 'text' },
        { value: 'bank_pin_code', label: 'PIN Code', type: 'text' },
        { value: 'bank_phone', label: 'Phone', type: 'text' },
        { value: 'bank_email', label: 'Email', type: 'email' },
        { value: 'bank_website', label: 'Website', type: 'url' },
        { value: 'bank_swift_code', label: 'SWIFT Code', type: 'text' },
        { value: 'bank_ifsc_code', label: 'IFSC Code', type: 'text' },
        { value: 'bank_currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] }
      ],
      'User': [
        { value: 'email', label: 'Email', type: 'email' },
        { value: 'first_name', label: 'First Name', type: 'text' },
        { value: 'last_name', label: 'Last Name', type: 'text' },
        { value: 'full_name', label: 'Full Name', type: 'text' },
        { value: 'enabled', label: 'Enabled', type: 'checkbox' },
        { value: 'user_type', label: 'User Type', type: 'select', options: ['System User', 'Website User', 'Portal User'] },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'time_zone', label: 'Time Zone', type: 'text' },
        { value: 'date_format', label: 'Date Format', type: 'select', options: ['dd-mm-yyyy', 'mm-dd-yyyy', 'yyyy-mm-dd'] },
        { value: 'time_format', label: 'Time Format', type: 'select', options: ['12 Hour', '24 Hour'] },
        { value: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] }
      ],
      'Sales Order': [
        { value: 'customer', label: 'Customer', type: 'text' },
        { value: 'transaction_date', label: 'Transaction Date', type: 'date' },
        { value: 'delivery_date', label: 'Delivery Date', type: 'date' },
        { value: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] },
        { value: 'conversion_rate', label: 'Conversion Rate', type: 'number' },
        { value: 'selling_price_list', label: 'Selling Price List', type: 'text' },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'customer_group', label: 'Customer Group', type: 'text' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'is_internal_customer', label: 'Is Internal Customer', type: 'checkbox' },
        { value: 'is_consolidated', label: 'Is Consolidated', type: 'checkbox' },
        { value: 'is_export', label: 'Is Export', type: 'checkbox' },
        { value: 'user_remark', label: 'User Remark', type: 'textarea' }
      ],
      'Purchase Order': [
        { value: 'supplier', label: 'Supplier', type: 'text' },
        { value: 'transaction_date', label: 'Transaction Date', type: 'date' },
        { value: 'schedule_date', label: 'Schedule Date', type: 'date' },
        { value: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] },
        { value: 'conversion_rate', label: 'Conversion Rate', type: 'number' },
        { value: 'buying_price_list', label: 'Buying Price List', type: 'text' },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'supplier_group', label: 'Supplier Group', type: 'text' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'is_internal_supplier', label: 'Is Internal Supplier', type: 'checkbox' },
        { value: 'is_consolidated', label: 'Is Consolidated', type: 'checkbox' },
        { value: 'is_export', label: 'Is Export', type: 'checkbox' },
        { value: 'user_remark', label: 'User Remark', type: 'textarea' }
      ],
      'Supplier': [
        { value: 'supplier_name', label: 'Supplier Name', type: 'text' },
        { value: 'supplier_type', label: 'Supplier Type', type: 'select', options: ['Individual', 'Company'] },
        { value: 'supplier_group', label: 'Supplier Group', type: 'text' },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'email_id', label: 'Email ID', type: 'email' },
        { value: 'mobile_no', label: 'Mobile Number', type: 'text' },
        { value: 'phone', label: 'Phone', type: 'text' },
        { value: 'website', label: 'Website', type: 'url' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'market_segment', label: 'Market Segment', type: 'text' },
        { value: 'industry', label: 'Industry', type: 'text' },
        { value: 'credit_limit', label: 'Credit Limit', type: 'number' },
        { value: 'credit_days', label: 'Credit Days', type: 'number' },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ],
      'Bank Account': [
        { value: 'account_name', label: 'Account Name', type: 'text' },
        { value: 'account_type', label: 'Account Type', type: 'select', options: ['Checking', 'Savings', 'Credit', 'Investment'] },
        { value: 'account_subtype', label: 'Account Subtype', type: 'select', options: ['Business', 'Personal', 'Joint'] },
        { value: 'account_number', label: 'Account Number', type: 'text' },
        { value: 'bank', label: 'Bank', type: 'text' },
        { value: 'bank_account_no', label: 'Bank Account No', type: 'text' },
        { value: 'bank_account_name', label: 'Bank Account Name', type: 'text' },
        { value: 'bank_branch', label: 'Bank Branch', type: 'text' },
        { value: 'bank_address', label: 'Bank Address', type: 'text' },
        { value: 'bank_city', label: 'Bank City', type: 'text' },
        { value: 'bank_state', label: 'Bank State', type: 'text' },
        { value: 'bank_country', label: 'Bank Country', type: 'text' },
        { value: 'bank_pin_code', label: 'Bank PIN Code', type: 'text' },
        { value: 'bank_phone', label: 'Bank Phone', type: 'text' },
        { value: 'bank_email', label: 'Bank Email', type: 'email' },
        { value: 'bank_website', label: 'Bank Website', type: 'url' },
        { value: 'bank_swift_code', label: 'Bank SWIFT Code', type: 'text' },
        { value: 'bank_ifsc_code', label: 'Bank IFSC Code', type: 'text' },
        { value: 'bank_currency', label: 'Bank Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] },
        { value: 'account_status', label: 'Account Status', type: 'select', options: ['Active', 'Inactive', 'Closed'] },
        { value: 'account_balance', label: 'Account Balance', type: 'number' },
        { value: 'account_credit_limit', label: 'Account Credit Limit', type: 'number' },
        { value: 'account_debit_limit', label: 'Account Debit Limit', type: 'number' },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' }
      ]
    };

    // If no specific mapping found, return common fields
    if (!fieldMappings[doctypeName]) {
      return [
        { value: 'name', label: 'Name', type: 'text' },
        { value: 'title', label: 'Title', type: 'text' },
        { value: 'description', label: 'Description', type: 'textarea' },
        { value: 'enabled', label: 'Enabled', type: 'checkbox' },
        { value: 'disabled', label: 'Disabled', type: 'checkbox' },
        { value: 'status', label: 'Status', type: 'text' },
        { value: 'email_id', label: 'Email ID', type: 'email' },
        { value: 'mobile_no', label: 'Mobile Number', type: 'text' },
        { value: 'phone', label: 'Phone', type: 'text' },
        { value: 'website', label: 'Website', type: 'url' },
        { value: 'language', label: 'Language', type: 'select', options: ['en', 'hi', 'es', 'fr', 'de'] },
        { value: 'currency', label: 'Currency', type: 'select', options: ['INR', 'USD', 'EUR', 'GBP'] },
        { value: 'territory', label: 'Territory', type: 'text' },
        { value: 'company', label: 'Company', type: 'text' },
        { value: 'branch', label: 'Branch', type: 'text' },
        { value: 'department', label: 'Department', type: 'text' },
        { value: 'designation', label: 'Designation', type: 'text' },
        { value: 'date_of_birth', label: 'Date of Birth', type: 'date' },
        { value: 'date_of_joining', label: 'Date of Joining', type: 'date' },
        { value: 'transaction_date', label: 'Transaction Date', type: 'date' },
        { value: 'delivery_date', label: 'Delivery Date', type: 'date' },
        { value: 'schedule_date', label: 'Schedule Date', type: 'date' },
        { value: 'valid_till', label: 'Valid Till', type: 'date' },
        { value: 'expected_closing', label: 'Expected Closing', type: 'date' },
        { value: 'amount', label: 'Amount', type: 'number' },
        { value: 'total', label: 'Total', type: 'number' },
        { value: 'net_total', label: 'Net Total', type: 'number' },
        { value: 'grand_total', label: 'Grand Total', type: 'number' },
        { value: 'discount_amount', label: 'Discount Amount', type: 'number' },
        { value: 'discount_percentage', label: 'Discount Percentage', type: 'number' },
        { value: 'conversion_rate', label: 'Conversion Rate', type: 'number' },
        { value: 'credit_limit', label: 'Credit Limit', type: 'number' },
        { value: 'credit_days', label: 'Credit Days', type: 'number' },
        { value: 'probability', label: 'Probability (%)', type: 'number' },
        { value: 'qty', label: 'Quantity', type: 'number' },
        { value: 'rate', label: 'Rate', type: 'number' },
        { value: 'standard_rate', label: 'Standard Rate', type: 'number' },
        { value: 'valuation_rate', label: 'Valuation Rate', type: 'number' },
        { value: 'last_purchase_rate', label: 'Last Purchase Rate', type: 'number' },
        { value: 'min_order_qty', label: 'Min Order Qty', type: 'number' },
        { value: 'safety_stock', label: 'Safety Stock', type: 'number' },
        { value: 'reorder_level', label: 'Reorder Level', type: 'number' },
        { value: 'reorder_qty', label: 'Reorder Qty', type: 'number' },
        { value: 'is_stock_item', label: 'Is Stock Item', type: 'checkbox' },
        { value: 'is_sales_item', label: 'Is Sales Item', type: 'checkbox' },
        { value: 'is_purchase_item', label: 'Is Purchase Item', type: 'checkbox' },
        { value: 'is_manufactured_item', label: 'Is Manufactured Item', type: 'checkbox' },
        { value: 'is_fixed_asset', label: 'Is Fixed Asset', type: 'checkbox' },
        { value: 'is_internal_customer', label: 'Is Internal Customer', type: 'checkbox' },
        { value: 'is_internal_supplier', label: 'Is Internal Supplier', type: 'checkbox' },
        { value: 'is_consolidated', label: 'Is Consolidated', type: 'checkbox' },
        { value: 'is_export', label: 'Is Export', type: 'checkbox' },
        { value: 'group_same_items', label: 'Group Same Items', type: 'checkbox' },
        { value: 'ignore_pricing_rule', label: 'Ignore Pricing Rule', type: 'checkbox' },
        { value: 'allow_alternative_item', label: 'Allow Alternative Item', type: 'checkbox' },
        { value: 'is_customer_provided_item', label: 'Is Customer Provided Item', type: 'checkbox' },
        { value: 'is_sub_contracted_item', label: 'Is Sub Contracted Item', type: 'checkbox' },
        { value: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
        { value: 'marital_status', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
        { value: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
        { value: 'customer_type', label: 'Customer Type', type: 'select', options: ['Individual', 'Company'] },
        { value: 'supplier_type', label: 'Supplier Type', type: 'select', options: ['Individual', 'Company'] },
        { value: 'lead_type', label: 'Lead Type', type: 'select', options: ['Individual', 'Company'] },
        { value: 'user_type', label: 'User Type', type: 'select', options: ['System User', 'Website User', 'Portal User'] },
        { value: 'bank_type', label: 'Bank Type', type: 'select', options: ['Bank', 'Credit Union', 'Investment Bank'] },
        { value: 'account_type', label: 'Account Type', type: 'select', options: ['Checking', 'Savings', 'Credit', 'Investment'] },
        { value: 'account_subtype', label: 'Account Subtype', type: 'select', options: ['Business', 'Personal', 'Joint'] },
        { value: 'account_status', label: 'Account Status', type: 'select', options: ['Active', 'Inactive', 'Closed'] },
        { value: 'date_format', label: 'Date Format', type: 'select', options: ['dd-mm-yyyy', 'mm-dd-yyyy', 'yyyy-mm-dd'] },
        { value: 'time_format', label: 'Time Format', type: 'select', options: ['12 Hour', '24 Hour'] },
        { value: 'apply_discount_on', label: 'Apply Discount On', type: 'select', options: ['Grand Total', 'Net Total'] },
        { value: 'base_discount_amount_on', label: 'Base Discount Amount On', type: 'select', options: ['Grand Total', 'Net Total'] },
        { value: 'other_charges_calculation', label: 'Other Charges Calculation', type: 'select', options: ['Manual', 'Automatic'] },
        { value: 'material_request_type', label: 'Material Request Type', type: 'select', options: ['Purchase', 'Transfer', 'Material Issue', 'Material Receipt'] },
        { value: 'quotation_to', label: 'Quotation To', type: 'select', options: ['Customer', 'Lead'] },
        { value: 'opportunity_from', label: 'Opportunity From', type: 'select', options: ['Lead', 'Customer', 'Prospect'] },
        { value: 'opportunity_type', label: 'Opportunity Type', type: 'select', options: ['Sales', 'Maintenance', 'Support'] },
        { value: 'customer_credit_days_based_on', label: 'Customer Credit Days Based On', type: 'select', options: ['Fixed Days', 'Last Day of Month', 'Last Day of Next Month'] },
        { value: 'supplier_credit_days_based_on', label: 'Supplier Credit Days Based On', type: 'select', options: ['Fixed Days', 'Last Day of Month', 'Last Day of Next Month'] }
      ];
    }
    
    return fieldMappings[doctypeName];
  };

  const generateFieldTemplate = (doctypeName, fieldName) => {
    const fields = getAvailableFields(doctypeName);
    const field = fields.find(f => f.value === fieldName);
    
    if (!field) return {};

    let defaultValue = '';
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'textarea':
        defaultValue = '';
        break;
      case 'number':
        defaultValue = 0;
        break;
      case 'checkbox':
        defaultValue = false;
        break;
      case 'select':
        defaultValue = field.options ? field.options[0] : '';
        break;
      case 'date':
        defaultValue = new Date().toISOString().split('T')[0];
        break;
      default:
        defaultValue = '';
    }

    return {
      [fieldName]: defaultValue
    };
  };

  const generatePostTemplate = (doctypeName) => {
    // Generate template based on doctype
    const templates = {
      'Customer': {
        customer_name: '',
        customer_type: 'Individual',
        territory: 'All Territories',
        customer_group: 'All Customer Groups',
        disabled: 0,
        email_id: '',
        mobile_no: '',
        phone: '',
        website: '',
        language: 'en',
        market_segment: '',
        industry: '',
        customer_primary_contact: '',
        customer_primary_address: '',
        customer_secondary_contact: '',
        customer_secondary_address: '',
        credit_limit: 0,
        credit_days: 0,
        credit_days_based_on: 'Fixed Days',
        credit_limit_on_sales_order: 0,
        credit_limit_on_delivery_note: 0,
        credit_limit_on_sales_invoice: 0,
        credit_limit_on_sales_return: 0,
        credit_limit_on_purchase_invoice: 0,
        credit_limit_on_purchase_return: 0,
        credit_limit_on_journal_entry: 0,
        credit_limit_on_payment_entry: 0,
        credit_limit_on_advance_payment: 0,
        credit_limit_on_advance_payment_entry: 0,
        credit_limit_on_advance_payment_entry_against_sales_invoice: 0,
        credit_limit_on_advance_payment_entry_against_purchase_invoice: 0,
        credit_limit_on_advance_payment_entry_against_sales_order: 0,
        credit_limit_on_advance_payment_entry_against_purchase_order: 0,
        credit_limit_on_advance_payment_entry_against_delivery_note: 0,
        credit_limit_on_advance_payment_entry_against_purchase_receipt: 0,
        credit_limit_on_advance_payment_entry_against_sales_return: 0,
        credit_limit_on_advance_payment_entry_against_purchase_return: 0,
        credit_limit_on_advance_payment_entry_against_journal_entry: 0,
        credit_limit_on_advance_payment_entry_against_payment_entry: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_sales_invoice: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_purchase_invoice: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_sales_order: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_purchase_order: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_delivery_note: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_purchase_receipt: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_sales_return: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_purchase_return: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_journal_entry: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_payment_entry: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_advance_payment: 0,
        credit_limit_on_advance_payment_entry_against_advance_payment_entry_against_advance_payment_entry: 0
      },
      'Item': {
        item_code: '',
        item_name: '',
        item_group: 'All Item Groups',
        stock_uom: 'Nos',
        is_stock_item: 1,
        is_sales_item: 1,
        is_purchase_item: 1,
        is_manufactured_item: 0,
        is_fixed_asset: 0,
        is_sub_contracted_item: 0,
        disabled: 0,
        allow_alternative_item: 0,
        is_customer_provided_item: 0,
        customer_code: '',
        customer_name: '',
        customer_item_code: '',
        customer_item_name: '',
        customer_description: '',
        supplier_code: '',
        supplier_name: '',
        supplier_item_code: '',
        supplier_item_name: '',
        supplier_description: '',
        valuation_rate: 0,
        standard_rate: 0,
        last_purchase_rate: 0,
        base_unit_rate: 0,
        base_unit: 'Nos',
        conversion_factor: 1,
        purchase_uom: 'Nos',
        sales_uom: 'Nos',
        min_order_qty: 0,
        safety_stock: 0,
        reorder_level: 0,
        reorder_qty: 0,
        material_request_type: 'Purchase',
        purchase_order_quantity: 0,
        min_order_qty: 0,
        safety_stock: 0,
        reorder_level: 0,
        reorder_qty: 0,
        material_request_type: 'Purchase',
        purchase_order_quantity: 0,
        min_order_qty: 0,
        safety_stock: 0,
        reorder_level: 0,
        reorder_qty: 0,
        material_request_type: 'Purchase',
        purchase_order_quantity: 0
      },
      'Bank': {
        bank_name: '',
        bank_code: '',
        bank_type: 'Bank',
        bank_account_no: '',
        bank_account_name: '',
        bank_branch: '',
        bank_address: '',
        bank_city: '',
        bank_state: '',
        bank_country: '',
        bank_pin_code: '',
        bank_phone: '',
        bank_email: '',
        bank_website: '',
        bank_swift_code: '',
        bank_ifsc_code: '',
        bank_micr_code: '',
        bank_routing_no: '',
        bank_clearing_code: '',
        bank_currency: 'INR',
        bank_account_type: 'Checking',
        bank_account_subtype: 'Business',
        bank_account_status: 'Active',
        bank_account_opening_date: new Date().toISOString().split('T')[0],
        bank_account_closing_date: null,
        bank_account_balance: 0,
        bank_account_credit_limit: 0,
        bank_account_debit_limit: 0,
        bank_account_interest_rate: 0,
        bank_account_interest_type: 'Simple',
        bank_account_interest_frequency: 'Monthly',
        bank_account_interest_calculation_method: 'Daily',
        bank_account_interest_calculation_base: 'Principal',
        bank_account_interest_calculation_period: 'Monthly',
        bank_account_interest_calculation_start_date: new Date().toISOString().split('T')[0],
        bank_account_interest_calculation_end_date: null,
        bank_account_interest_calculation_amount: 0,
        bank_account_interest_calculation_rate: 0,
        bank_account_interest_calculation_type: 'Simple',
        bank_account_interest_calculation_frequency: 'Monthly',
        bank_account_interest_calculation_method: 'Daily',
        bank_account_interest_calculation_base: 'Principal',
        bank_account_interest_calculation_period: 'Monthly',
        bank_account_interest_calculation_start_date: new Date().toISOString().split('T')[0],
        bank_account_interest_calculation_end_date: null,
        bank_account_interest_calculation_amount: 0,
        bank_account_interest_calculation_rate: 0
      },
      'User': {
        email: '',
        first_name: '',
        last_name: '',
        full_name: '',
        enabled: 1,
        user_type: 'System User',
        language: 'en',
        time_zone: 'Asia/Kolkata',
        date_format: 'dd-mm-yyyy',
        time_format: '24 Hour',
        currency: 'INR',
        number_format: '1,23,456.78',
        digit_grouping: '1,23,456.78',
        decimal_separator: '.',
        thousands_separator: ',',
        fiscal_year: 'April',
        fiscal_year_start_date: '04-01',
        fiscal_year_end_date: '03-31',
        fiscal_year_start_month: 'April',
        fiscal_year_end_month: 'March',
        fiscal_year_start_day: 1,
        fiscal_year_end_day: 31,
        fiscal_year_start_year: new Date().getFullYear(),
        fiscal_year_end_year: new Date().getFullYear() + 1,
        fiscal_year_start_date_formatted: '04-01-' + new Date().getFullYear(),
        fiscal_year_end_date_formatted: '03-31-' + (new Date().getFullYear() + 1),
        fiscal_year_start_date_iso: new Date().getFullYear() + '-04-01',
        fiscal_year_end_date_iso: (new Date().getFullYear() + 1) + '-03-31',
        fiscal_year_start_date_display: '01 Apr ' + new Date().getFullYear(),
        fiscal_year_end_date_display: '31 Mar ' + (new Date().getFullYear() + 1),
        fiscal_year_start_date_display_long: '01 April ' + new Date().getFullYear(),
        fiscal_year_end_date_display_long: '31 March ' + (new Date().getFullYear() + 1),
        fiscal_year_start_date_display_short: '01 Apr ' + new Date().getFullYear(),
        fiscal_year_end_date_display_short: '31 Mar ' + (new Date().getFullYear() + 1),
        fiscal_year_start_date_display_very_short: '01 Apr ' + new Date().getFullYear(),
        fiscal_year_end_date_display_very_short: '31 Mar ' + (new Date().getFullYear() + 1)
      },
      'Sales Order': {
        customer: '',
        transaction_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        items: [],
        currency: 'INR',
        conversion_rate: 1,
        selling_price_list: 'Standard Selling',
        price_list_currency: 'INR',
        plc_conversion_rate: 1,
        ignore_pricing_rule: 0,
        set_warehouse: '',
        set_reserve_warehouse: '',
        customer_address: '',
        address_display: '',
        contact_person: '',
        contact_display: '',
        contact_mobile: '',
        contact_email: '',
        contact_phone: '',
        contact_designation: '',
        contact_department: '',
        territory: '',
        customer_group: '',
        language: 'en',
        is_internal_customer: 0,
        is_consolidated: 0,
        is_export: 0,
        symbol: '₹',
        letter_head: '',
        print_heading: '',
        group_same_items: 0,
        is_fixed_asset: 0,
        select_print_heading: '',
        user_remark: '',
        total_qty: 0,
        base_total: 0,
        base_net_total: 0,
        total: 0,
        net_total: 0,
        total_taxes_and_charges: 0,
        base_total_taxes_and_charges: 0,
        grand_total: 0,
        base_grand_total: 0,
        round_total: 0,
        base_round_total: 0,
        rounded_total: 0,
        base_rounded_total: 0,
        discount_amount: 0,
        base_discount_amount: 0,
        additional_discount_percentage: 0,
        discount_percentage: 0,
        apply_discount_on: 'Grand Total',
        base_discount_amount_on: 'Grand Total',
        other_charges_calculation: 'Manual',
        shipping_rule: '',
        shipping_address: '',
        shipping_address_display: '',
        billing_address: '',
        billing_address_display: '',
        customer_name: '',
        customer_territory: '',
        customer_group: '',
        customer_type: '',
        customer_primary_contact: '',
        customer_primary_address: '',
        customer_secondary_contact: '',
        customer_secondary_address: '',
        customer_credit_limit: 0,
        customer_credit_days: 0,
        customer_credit_days_based_on: 'Fixed Days',
        customer_credit_limit_on_sales_order: 0,
        customer_credit_limit_on_delivery_note: 0,
        customer_credit_limit_on_sales_invoice: 0,
        customer_credit_limit_on_sales_return: 0,
        customer_credit_limit_on_purchase_invoice: 0,
        customer_credit_limit_on_purchase_return: 0,
        customer_credit_limit_on_journal_entry: 0,
        customer_credit_limit_on_payment_entry: 0,
        customer_credit_limit_on_advance_payment: 0,
        customer_credit_limit_on_advance_payment_entry: 0,
        customer_credit_limit_on_advance_payment_entry_against_sales_invoice: 0,
        customer_credit_limit_on_advance_payment_entry_against_purchase_invoice: 0,
        customer_credit_limit_on_advance_payment_entry_against_sales_order: 0,
        customer_credit_limit_on_advance_payment_entry_against_purchase_order: 0,
        customer_credit_limit_on_advance_payment_entry_against_delivery_note: 0,
        customer_credit_limit_on_advance_payment_entry_against_purchase_receipt: 0,
        customer_credit_limit_on_advance_payment_entry_against_sales_return: 0,
        customer_credit_limit_on_advance_payment_entry_against_purchase_return: 0,
        customer_credit_limit_on_advance_payment_entry_against_journal_entry: 0,
        customer_credit_limit_on_advance_payment_entry_against_payment_entry: 0,
        customer_credit_limit_on_advance_payment_entry_against_advance_payment: 0,
        customer_credit_limit_on_advance_payment_entry_against_advance_payment_entry: 0
      },
      'Purchase Order': {
        supplier: '',
        transaction_date: new Date().toISOString().split('T')[0],
        schedule_date: new Date().toISOString().split('T')[0],
        items: [],
        currency: 'INR',
        conversion_rate: 1,
        buying_price_list: 'Standard Buying',
        price_list_currency: 'INR',
        plc_conversion_rate: 1,
        ignore_pricing_rule: 0,
        set_warehouse: '',
        set_reserve_warehouse: '',
        supplier_address: '',
        address_display: '',
        contact_person: '',
        contact_display: '',
        contact_mobile: '',
        contact_email: '',
        contact_phone: '',
        contact_designation: '',
        contact_department: '',
        territory: '',
        supplier_group: '',
        language: 'en',
        is_internal_supplier: 0,
        is_consolidated: 0,
        is_export: 0,
        symbol: '₹',
        letter_head: '',
        print_heading: '',
        group_same_items: 0,
        is_fixed_asset: 0,
        select_print_heading: '',
        user_remark: '',
        total_qty: 0,
        base_total: 0,
        base_net_total: 0,
        total: 0,
        net_total: 0,
        total_taxes_and_charges: 0,
        base_total_taxes_and_charges: 0,
        grand_total: 0,
        base_grand_total: 0,
        round_total: 0,
        base_round_total: 0,
        rounded_total: 0,
        base_rounded_total: 0,
        discount_amount: 0,
        base_discount_amount: 0,
        additional_discount_percentage: 0,
        discount_percentage: 0,
        apply_discount_on: 'Grand Total',
        base_discount_amount_on: 'Grand Total',
        other_charges_calculation: 'Manual',
        shipping_rule: '',
        shipping_address: '',
        shipping_address_display: '',
        billing_address: '',
        billing_address_display: '',
        supplier_name: '',
        supplier_territory: '',
        supplier_group: '',
        supplier_type: '',
        supplier_primary_contact: '',
        supplier_primary_address: '',
        supplier_secondary_contact: '',
        supplier_secondary_address: '',
        supplier_credit_limit: 0,
        supplier_credit_days: 0,
        supplier_credit_days_based_on: 'Fixed Days',
        supplier_credit_limit_on_purchase_order: 0,
        supplier_credit_limit_on_purchase_receipt: 0,
        supplier_credit_limit_on_purchase_invoice: 0,
        supplier_credit_limit_on_purchase_return: 0,
        supplier_credit_limit_on_sales_invoice: 0,
        supplier_credit_limit_on_sales_return: 0,
        supplier_credit_limit_on_journal_entry: 0,
        supplier_credit_limit_on_payment_entry: 0,
        supplier_credit_limit_on_advance_payment: 0,
        supplier_credit_limit_on_advance_payment_entry: 0,
        supplier_credit_limit_on_advance_payment_entry_against_purchase_invoice: 0,
        supplier_credit_limit_on_advance_payment_entry_against_sales_invoice: 0,
        supplier_credit_limit_on_advance_payment_entry_against_purchase_order: 0,
        supplier_credit_limit_on_advance_payment_entry_against_sales_order: 0,
        supplier_credit_limit_on_advance_payment_entry_against_purchase_receipt: 0,
        supplier_credit_limit_on_advance_payment_entry_against_delivery_note: 0,
        supplier_credit_limit_on_advance_payment_entry_against_purchase_return: 0,
        supplier_credit_limit_on_advance_payment_entry_against_sales_return: 0,
        supplier_credit_limit_on_advance_payment_entry_against_journal_entry: 0,
        supplier_credit_limit_on_advance_payment_entry_against_payment_entry: 0,
        supplier_credit_limit_on_advance_payment_entry_against_advance_payment: 0,
        supplier_credit_limit_on_advance_payment_entry_against_advance_payment_entry: 0
      }
    };

    // Get template for the doctype or create a basic one
    const template = templates[doctypeName] || {
      name: '',
      title: '',
      description: '',
      enabled: 1,
      disabled: 0
    };

    // Set the template as the request body
    setBody(JSON.stringify(template, null, 2));
    console.log(`Generated POST template for ${doctypeName}:`, template);
  };

  const handleRecordChange = (recordName) => {
    setSelectedRecord(recordName);
    // Update the URL to include the selected record
    if (recordName && doctype) {
      setUrl(`/api/resource/${doctype}/${recordName}`);
    } else if (doctype) {
      setUrl(`/api/resource/${doctype}`);
    }
  };

  const loadAvailableFields = (doctypeName) => {
    const fields = getAvailableFields(doctypeName);
    setAvailableFields(fields);
    setSelectedField('');
    console.log(`Loaded ${fields.length} available fields for ${doctypeName}:`, fields);
  };

  const handleFieldChange = (fieldName) => {
    setSelectedField(fieldName);
    setCustomField('');
    setShowCustomField(false);
    if (fieldName && doctype) {
      const template = generateFieldTemplate(doctype, fieldName);
      setBody(JSON.stringify(template, null, 2));
      console.log(`Generated field template for ${doctype}.${fieldName}:`, template);
    }
  };

  const handleCustomFieldChange = (fieldName) => {
    setCustomField(fieldName);
    setSelectedField('');
    setShowCustomField(true);
    if (fieldName && doctype) {
      // Generate a basic template for custom field
      const template = { [fieldName]: '' };
      setBody(JSON.stringify(template, null, 2));
      console.log(`Generated custom field template for ${doctype}.${fieldName}:`, template);
    }
  };

  // Generate cURL command
  const generateCurlCommand = () => {
    const finalDoctype = doctype || customDoctype;
    const finalUrl = url || `/api/resource/${finalDoctype}`;
    
    // Build the full URL
    let fullUrl = baseURL + finalUrl;
    if (params) {
      fullUrl += (finalUrl.includes('?') ? '&' : '?') + params;
    }
    
    // Start building the cURL command
    let curlCmd = `curl -X ${method}`;
    
    // Add headers
    const allHeaders = {
      ...headers,
      'Authorization': `token ${apiKey}:${apiSecret}`,
      'Content-Type': 'application/json'
    };
    
    Object.entries(allHeaders).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        curlCmd += ` \\\n  -H "${key}: ${value}"`;
      }
    });
    
    // Add body for POST, PUT methods
    if ((method === 'POST' || method === 'PUT') && body && body.trim() !== '' && body.trim() !== '{}') {
      // Escape quotes in JSON body and format it nicely
      const escapedBody = body.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      curlCmd += ` \\\n  -d "${escapedBody}"`;
    }
    
    // Add URL
    curlCmd += ` \\\n  "${fullUrl}"`;
    
    return curlCmd;
  };

  // Copy cURL command to clipboard
  const copyCurlCommand = async () => {
    try {
      const curlCmd = generateCurlCommand();
      await navigator.clipboard.writeText(curlCmd);
      // Show success feedback
      const button = document.querySelector('.copy-curl-btn');
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✅ Copied!';
        button.style.backgroundColor = '#10b981';
        button.style.borderColor = '#10b981';
        button.style.color = 'white';
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.style.borderColor = '';
          button.style.color = '';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy cURL command:', err);
      alert('Failed to copy cURL command. Please try again.');
    }
  };

  // Toggle cURL code panel
  const toggleCurlCode = () => {
    setShowCurlCode(!showCurlCode);
  };

  // Update cURL command whenever relevant data changes
  useEffect(() => {
    if (showCurlCode) {
      setCurlCommand(generateCurlCommand());
    }
  }, [method, doctype, customDoctype, url, headers, body, params, baseURL, apiKey, apiSecret, showCurlCode]);

  const handleDoctypeChange = (selectedDoctype) => {
    setDoctype(selectedDoctype);
    setCustomDoctype('');
    setShowCustomDoctype(false);
    updateUrl(selectedDoctype, method);
    
    // If PUT or DELETE method and any doctype, fetch records
    if ((method === 'PUT' || method === 'DELETE') && selectedDoctype && isConnected) {
      fetchRecordsForDoctype(selectedDoctype);
    }
    
    // If PUT method, also load available fields
    if (method === 'PUT' && selectedDoctype && isConnected) {
      loadAvailableFields(selectedDoctype);
    }
    
    // If POST method and any doctype, generate template
    if (method === 'POST' && selectedDoctype && isConnected) {
      generatePostTemplate(selectedDoctype);
    }
  };

  const handleCustomDoctypeChange = (value) => {
    setCustomDoctype(value);
    setDoctype('');
    setShowCustomDoctype(true);
    updateUrl(value, method);
  };

  const updateUrl = (doctypeName, httpMethod) => {
    if (doctypeName) {
      const baseUrl = `/api/resource/${doctypeName}`;
      setUrl(baseUrl);
    } else {
      setUrl('');
    }
  };

  const handleHeaderChange = (key, value) => {
    setHeaders(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addHeader = () => {
    const key = prompt('Header key:');
    if (key) {
      setHeaders(prev => ({
        ...prev,
        [key]: ''
      }));
    }
  };

  const removeHeader = (key) => {
    setHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  };

  const validateJson = (jsonString) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Removed save/load credentials - they reset on refresh

  const handleSubmit = async () => {
    setError(null);
    setResponseError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!doctype && !customDoctype) {
        throw new Error('Please select or enter an endpoint');
      }

      if (!baseURL) {
        throw new Error('Please provide Base URL');
      }

      if (!apiKey || !apiSecret) {
        throw new Error('Please provide API Key and API Secret');
      }

      if (method !== 'GET' && body && !validateJson(body)) {
        throw new Error('Request body must be valid JSON');
      }

      const finalDoctype = doctype || customDoctype;
      const finalUrl = url || `/api/resource/${finalDoctype}`;

      // Prepare request data
      const requestData = {
        method,
        doctype: finalDoctype,
        url: finalUrl,
        baseURL,
        headers: {
          ...headers,
          'Authorization': `token ${apiKey}:${apiSecret}`,
          'Content-Type': 'application/json'
        },
        body: method !== 'GET' ? body : '',
        params
      };

      // Make the API call using the new API client
      const result = await makeApiRequest(requestData);
      
      if (result.success) {
        // Show response on the same page
        setResponse(result.data);
        setResponseError(null);
        onRequest(requestData);
        onResponse(result.data, null);
      } else {
        throw new Error(result.error);
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      setResponseError(errorMessage);
      setResponse(null);
      onResponse(null, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="request-builder" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '0', margin: '0', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <div className="card-header" style={{ padding: '12px 16px', marginBottom: '0', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <h2 className="card-title" style={{ fontSize: '18px', margin: '0', fontWeight: '600', color: '#1e293b' }}>
            🔧 Build Request
          </h2>
        </div>
        
        <div className="request-builder-content" style={{ padding: '16px' }}>
        
        {/* Authentication Section - Enhanced */}
        <div className="auth-section" style={{ padding: '16px', marginBottom: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>🔐 Authentication</h4>
          <div className="auth-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>🌐 Base URL</label>
              <input
                type="url"
                className="form-control"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="https://your-erpnext-instance.com"
                style={{ fontSize: '14px', padding: '10px 12px', height: '40px', border: '2px solid #d1d5db', borderRadius: '6px', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>🔑 API Key</label>
              <input
                type="text"
                className="form-control"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key"
                style={{ fontSize: '14px', padding: '10px 12px', height: '40px', border: '2px solid #d1d5db', borderRadius: '6px', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '500', color: '#374151' }}>🔐 API Secret</label>
              <input
                type="password"
                className="form-control"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="API Secret"
                style={{ fontSize: '14px', padding: '10px 12px', height: '40px', border: '2px solid #d1d5db', borderRadius: '6px', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <button
                className="btn btn-primary"
                onClick={testERPNextConnection}
                disabled={connectionLoading || !baseURL || !apiKey || !apiSecret}
                style={{ 
                  fontSize: '14px', 
                  padding: '10px 16px', 
                  height: '40px', 
                  borderRadius: '6px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(-1px)', e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)')}
                onMouseOut={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)')}
              >
                {connectionLoading ? '🔄 Testing...' : '🔗 Connect'}
              </button>
            </div>
          </div>
          
          {/* Connection Status */}
          {connectionStatus === 'success' && (
            <div className="success-message" style={{ 
              fontSize: '14px', 
              marginTop: '12px', 
              padding: '8px 12px',
              backgroundColor: '#d1fae5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
              ✅ Connected to ERPNext successfully!
            </div>
          )}
          
          {connectionStatus === 'error' && connectionError && (
            <div className="error-message" style={{ 
              fontSize: '14px', 
              marginTop: '12px', 
              padding: '8px 12px',
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              fontWeight: '500'
            }}>
              ❌ Connection failed: {connectionError}
            </div>
          )}
        </div>

        {/* HTTP Method Selection - Enhanced */}
        <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
          <label className="form-label" style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>🌐 HTTP Method</label>
          <div className="method-selector" style={{ display: 'flex', gap: '8px' }}>
            {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
              <button
                key={m}
                className={`method-btn ${method === m ? 'active' : ''}`}
                onClick={() => handleMethodChange(m)}
                style={{ 
                  fontSize: '14px', 
                  padding: '12px 20px', 
                  height: '48px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  border: '2px solid transparent'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                <span className={`method-tag method-${m.toLowerCase()}`}>{m}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint Selection - Enhanced */}
        <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
          <label className="form-label" style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>📄 Select Endpoint</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              className="form-control"
              value={doctype}
              onChange={(e) => handleDoctypeChange(e.target.value)}
              style={{ 
                flex: 1, 
                fontSize: '14px', 
                padding: '12px 16px', 
                height: '48px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="">Select endpoint...</option>
              {doctypes.map((dt, index) => (
                <option key={index} value={dt}>{dt}</option>
              ))}
            </select>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>or</span>
            <input
              type="text"
              className="form-control"
              value={customDoctype}
              onChange={(e) => handleCustomDoctypeChange(e.target.value)}
              placeholder="Custom endpoint"
              style={{ 
                flex: 1, 
                fontSize: '14px', 
                padding: '12px 16px', 
                height: '48px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>
          
          {/* Fetch Data Button for PUT operations */}
          {method === 'PUT' && doctype && isConnected && (
            <div style={{ marginTop: '12px' }}>
              <button
                className="btn btn-info"
                onClick={fetchDoctypeData}
                disabled={loading}
                style={{ 
                  fontSize: '14px', 
                  padding: '10px 20px', 
                  height: '40px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(-1px)', e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)')}
                onMouseOut={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)')}
              >
                {loading ? '🔄 Fetching Data...' : '📥 Fetch Data & Show Template'}
              </button>
            </div>
          )}
          
          {/* Generate Template Button for POST operations */}
          {method === 'POST' && doctype && isConnected && (
            <div style={{ marginTop: '12px' }}>
              <button
                className="btn btn-success"
                onClick={() => generatePostTemplate(doctype)}
                style={{ 
                  fontSize: '14px', 
                  padding: '10px 20px', 
                  height: '40px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                ✨ Generate {doctype} Template
              </button>
            </div>
          )}
        </div>

        {/* URL Display - Enhanced */}
        <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
          <label className="form-label" style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>URL</label>
          <input
            type="text"
            className="form-control"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="API endpoint URL"
            style={{ 
              fontSize: '14px', 
              padding: '12px 16px', 
              height: '48px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Record Selection for PUT operations - Enhanced */}
        {method === 'PUT' && doctype && isConnected && (
          <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
            <label className="form-label" style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              📝 Select {doctype} Record
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                className="form-control"
                value={selectedRecord}
                onChange={(e) => handleRecordChange(e.target.value)}
                disabled={loadingRecords}
                style={{ 
                  flex: 1, 
                  fontSize: '14px', 
                  padding: '12px 16px', 
                  height: '48px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="">
                  {loadingRecords ? 'Loading...' : `Select ${doctype.toLowerCase()}...`}
                </option>
                {records.map((record, index) => (
                  <option key={index} value={record.name}>
                    {record.display_name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-info"
                onClick={() => fetchRecordsForDoctype(doctype)}
                disabled={loadingRecords}
                style={{ 
                  fontSize: '14px', 
                  padding: '12px 16px', 
                  height: '48px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(-1px)', e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)')}
                onMouseOut={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)')}
              >
                {loadingRecords ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6b7280', 
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              💡 Select a {doctype.toLowerCase()} to update. URL will include the record name.
              {records.length > 0 && ` (${records.length} records loaded)`}
            </div>
          </div>
        )}

        {/* Field Selection for PUT operations - Enhanced with Custom Field */}
        {method === 'PUT' && doctype && isConnected && (
          <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
            <label className="form-label" style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              🔧 Select Field to Update
            </label>
            
            {/* Predefined Fields Dropdown */}
            {availableFields.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <select
                  className="form-control"
                  value={selectedField}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  style={{ 
                    flex: 1, 
                    fontSize: '14px', 
                    padding: '12px 16px', 
                    height: '48px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                >
                  <option value="">Select predefined field...</option>
                  {availableFields.map((field, index) => (
                    <option key={index} value={field.value}>
                      {field.label} ({field.type})
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-warning"
                  onClick={() => {
                    setSelectedField('');
                    setCustomField('');
                    setShowCustomField(false);
                    setBody('{}');
                  }}
                  style={{ 
                    fontSize: '14px', 
                    padding: '12px 16px', 
                    height: '48px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  🗑️ Clear
                </button>
              </div>
            )}

            {/* Custom Field Input */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value={customField}
                onChange={(e) => handleCustomFieldChange(e.target.value)}
                placeholder="Enter custom field name (e.g., custom_field_name)"
                style={{ 
                  flex: 1, 
                  fontSize: '14px', 
                  padding: '12px 16px', 
                  height: '48px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                className="btn btn-success"
                onClick={() => generateCustomFieldTemplate(customField)}
                disabled={!customField}
                style={{ 
                  fontSize: '14px', 
                  padding: '12px 16px', 
                  height: '48px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(-1px)', e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)')}
                onMouseOut={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)')}
              >
                ✨ Generate
              </button>
            </div>
            
            <div style={{ 
              fontSize: '14px', 
              color: '#1e40af', 
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              border: '1px solid #bfdbfe'
            }}>
              ✨ Select a predefined field or enter a custom field name to generate a focused update template. You can edit the value and send the request.
              {availableFields.length > 0 && ` (${availableFields.length} predefined fields available)`}
            </div>
          </div>
        )}

        {/* Record Selection for DELETE operations - Enhanced */}
        {method === 'DELETE' && doctype && isConnected && (
          <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
            <label className="form-label" style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
              🗑️ Select {doctype} Record to Delete
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                className="form-control"
                value={selectedRecord}
                onChange={(e) => handleRecordChange(e.target.value)}
                disabled={loadingRecords}
                style={{ 
                  flex: 1, 
                  fontSize: '14px', 
                  padding: '12px 16px', 
                  height: '48px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              >
                <option value="">
                  {loadingRecords ? 'Loading...' : `Select ${doctype.toLowerCase()} to delete...`}
                </option>
                {records.map((record, index) => (
                  <option key={index} value={record.name}>
                    {record.display_name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-info"
                onClick={() => fetchRecordsForDoctype(doctype)}
                disabled={loadingRecords}
                style={{ 
                  fontSize: '14px', 
                  padding: '12px 16px', 
                  height: '48px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(-1px)', e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)')}
                onMouseOut={(e) => !e.target.disabled && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)')}
              >
                {loadingRecords ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#dc2626', 
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: '#fef2f2',
              borderRadius: '6px',
              border: '1px solid #fecaca'
            }}>
              ⚠️ <strong>Warning:</strong> Select a {doctype.toLowerCase()} to delete. This action cannot be undone!
              {records.length > 0 && ` (${records.length} records loaded)`}
            </div>
          </div>
        )}

        {/* Headers - Enhanced */}
        <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ fontSize: '16px', marginBottom: '0', fontWeight: '600', color: '#374151' }}>Headers</label>
            <button 
              className="btn btn-secondary" 
              onClick={addHeader} 
              style={{ 
                padding: '10px 16px', 
                fontSize: '14px', 
                height: '40px',
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
            >
              + Add Header
            </button>
          </div>
          {Object.entries(headers).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="form-control"
                value={key}
                onChange={(e) => {
                  const newHeaders = { ...headers };
                  delete newHeaders[key];
                  newHeaders[e.target.value] = value;
                  setHeaders(newHeaders);
                }}
                style={{ 
                  flex: 1, 
                  fontSize: '14px', 
                  padding: '10px 12px', 
                  height: '40px',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Header name"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>:</span>
              <input
                type="text"
                className="form-control"
                value={value}
                onChange={(e) => handleHeaderChange(key, e.target.value)}
                style={{ 
                  flex: 2, 
                  fontSize: '14px', 
                  padding: '10px 12px', 
                  height: '40px',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px',
                  transition: 'border-color 0.2s'
                }}
                placeholder="Header value"
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                className="btn btn-danger"
                onClick={() => removeHeader(key)}
                style={{ 
                  padding: '10px 12px', 
                  fontSize: '14px', 
                  height: '40px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Request Body (for POST, PUT, DELETE) - Enhanced */}
        {method !== 'GET' && (
          <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
            <label className="form-label" style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Request Body (JSON)</label>
            {method === 'PUT' && (
              <div style={{ 
                fontSize: '14px', 
                color: '#1e40af', 
                marginBottom: '8px',
                padding: '12px 16px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                {selectedField ? (
                  <>💡 <strong>PUT:</strong> Field-specific update for {doctype}.{selectedField}. Edit the value and send.</>
                ) : (
                  <>💡 <strong>PUT:</strong> Template JSON for {doctype}. Edit values and send.</>
                )}
              </div>
            )}
            {method === 'POST' && doctype && (
              <div style={{ 
                fontSize: '14px', 
                color: '#059669', 
                marginBottom: '8px',
                padding: '12px 16px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                ✨ <strong>POST:</strong> Template JSON for creating new {doctype}. Edit values and send.
              </div>
            )}
            {method === 'DELETE' && (
              <div style={{ 
                fontSize: '14px', 
                color: '#dc2626', 
                marginBottom: '8px',
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                ⚠️ <strong>DELETE:</strong> No request body needed. The record will be deleted based on the URL.
              </div>
            )}
            <textarea
              className="form-control textarea json-editor"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={method === 'DELETE' ? 'No request body needed for DELETE' : 'Enter JSON request body'}
              disabled={method === 'DELETE'}
              style={{ 
                fontSize: '14px', 
                padding: '12px 16px', 
                minHeight: '120px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                transition: 'border-color 0.2s',
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                backgroundColor: method === 'DELETE' ? '#f9fafb' : 'white',
                color: method === 'DELETE' ? '#6b7280' : 'inherit'
              }}
              onFocus={(e) => !e.target.disabled && (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => !e.target.disabled && (e.target.style.borderColor = '#d1d5db')}
            />
          </div>
        )}

        {/* Query Parameters - Enhanced */}
        <div className="form-group" style={{ marginBottom: '16px', padding: '0 16px' }}>
          <label className="form-label" style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>Query Parameters</label>
          <input
            type="text"
            className="form-control"
            value={params}
            onChange={(e) => setParams(e.target.value)}
            placeholder="e.g., name=value&limit=20"
            style={{ 
              fontSize: '14px', 
              padding: '12px 16px', 
              height: '48px',
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

          {/* Submit Button - Enhanced */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
              style={{ 
                flex: 1, 
                fontSize: '16px', 
                padding: '14px 24px', 
                height: '52px',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                if (!e.target.disabled) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
                }
              }}
              onMouseOut={(e) => {
                if (!e.target.disabled) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }
              }}
            >
              {loading ? '🔄 Sending Request...' : '🚀 Send Request'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('/')}
              style={{ 
                fontSize: '16px', 
                padding: '14px 24px', 
                height: '52px',
                borderRadius: '8px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* cURL Code Panel - Like Postman's Code Snippets */}
        <div style={{ marginTop: '16px', padding: '0 16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '12px' 
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#374151', 
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📋 Code Snippets
            </h3>
            <button
              className="btn btn-outline-primary"
              onClick={toggleCurlCode}
              style={{ 
                fontSize: '14px', 
                padding: '8px 16px', 
                height: '36px',
                borderRadius: '6px',
                fontWeight: '500',
                transition: 'all 0.2s',
                border: '1px solid #3b82f6',
                color: '#3b82f6',
                backgroundColor: 'white'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = '#3b82f6';
              }}
            >
              {showCurlCode ? 'Hide cURL' : 'Show cURL'}
            </button>
          </div>
          
          {showCurlCode && (
            <div style={{ 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '12px' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    cURL Command
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    backgroundColor: '#e5e7eb',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    Terminal
                  </span>
                </div>
                <button
                  className="btn btn-sm btn-outline-secondary copy-curl-btn"
                  onClick={copyCurlCommand}
                  style={{ 
                    fontSize: '12px', 
                    padding: '6px 12px', 
                    height: '28px',
                    borderRadius: '4px',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    border: '1px solid #6b7280',
                    color: '#6b7280',
                    backgroundColor: 'white'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#6b7280';
                    e.target.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#6b7280';
                  }}
                >
                  📋 Copy
                </button>
              </div>
              
              <pre style={{ 
                backgroundColor: '#1e293b', 
                color: '#e2e8f0',
                padding: '16px', 
                borderRadius: '6px',
                overflow: 'auto',
                maxHeight: '300px',
                fontFamily: 'JetBrains Mono, Fira Code, Courier New, monospace',
                fontSize: '13px',
                lineHeight: '1.5',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {generateCurlCommand()}
              </pre>
              
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280', 
                marginTop: '8px',
                fontStyle: 'italic'
              }}>
                💡 This cURL command can be run directly in your terminal to make the same API request
              </div>
            </div>
          )}
        </div>

        {/* Footer Card with Navigation - Like in the image */}
        <div className="request-builder-footer" style={{ 
          backgroundColor: '#ffffff', 
          borderTop: '1px solid #e2e8f0',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: '0 0 8px 8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: 'white',
              fontWeight: 'bold'
            }}>
              🧭
            </div>
            <div>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#1e293b', 
                margin: '0 0 4px 0' 
              }}>
                Request Builder
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                margin: '0' 
              }}>
                Use the back button to return to the previous page (Alt + ←)
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="back-button" 
              onClick={() => onNavigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f9fafb';
                e.target.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#ffffff';
                e.target.style.borderColor = '#d1d5db';
              }}
            >
              <span style={{ fontSize: '16px' }}>←</span>
              Back
            </button>
            <button 
              className="dashboard-button" 
              onClick={() => onNavigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.borderColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#3b82f6';
                e.target.style.borderColor = '#3b82f6';
              }}
            >
              <span style={{ fontSize: '16px' }}>🏠</span>
              Dashboard.
            </button>
          </div>
        </div>
      </div>

      {/* Response Display Section - Enhanced */}
      {(response || responseError) && (
        <div className="card" style={{ marginTop: '16px', maxWidth: '800px', margin: '16px auto 0', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
          <div className="card-header" style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h3 className="card-title" style={{ fontSize: '18px', margin: '0', fontWeight: '600', color: '#1e293b' }}>
              📡 API Response
            </h3>
          </div>
          {responseError ? (
            <div className="error-message">
              <h4>❌ Error Response:</h4>
              <pre style={{ 
                backgroundColor: '#1e293b', 
                color: '#e2e8f0',
                padding: '15px', 
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '400px',
                fontFamily: 'JetBrains Mono, Fira Code, Courier New, monospace',
                fontSize: '0.875rem',
                lineHeight: '1.6'
              }}>
                {responseError}
              </pre>
            </div>
          ) : (
            <div className="response-display">
              <div className="success-message" style={{ marginBottom: '15px' }}>
                ✅ <strong>Success Response</strong> - Request completed successfully
              </div>
              <pre style={{ 
                backgroundColor: '#1e293b', 
                color: '#e2e8f0',
                padding: '15px', 
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '400px',
                fontFamily: 'JetBrains Mono, Fira Code, Courier New, monospace',
                fontSize: '0.875rem',
                lineHeight: '1.6'
              }}>
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestBuilder;
