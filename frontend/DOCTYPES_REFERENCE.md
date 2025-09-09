# ERPNext Doctypes Reference

This document lists all the common ERPNext doctypes available in the API tester.

## 🔑 Core Doctypes
- **User** - System users and authentication
- **Role** - User roles and permissions
- **DocType** - Custom doctype definitions
- **File** - File attachments and documents
- **Tag** - Content tagging system
- **Version** - Document versioning
- **ToDo** - Task management

## 📦 Stock & Inventory
- **Item** - Products and services
- **Item Group** - Product categorization
- **Item Price** - Pricing information
- **Batch** - Batch tracking for items
- **Serial No** - Serial number tracking
- **Stock Entry** - Stock movements
- **Stock Ledger Entry** - Stock transaction history
- **Stock Reconciliation** - Stock counting and adjustment
- **Delivery Note** - Goods delivery documentation
- **Purchase Receipt** - Goods received documentation
- **Warehouse** - Storage locations

## 💰 Accounts
- **Customer** - Customer master data
- **Supplier** - Supplier master data
- **Sales Invoice** - Customer billing
- **Purchase Invoice** - Supplier billing
- **Journal Entry** - Accounting entries
- **Payment Entry** - Payment transactions
- **Payment Request** - Payment requests
- **Bank Account** - Bank account information
- **Bank Transaction** - Bank transaction records
- **Pricing Rule** - Dynamic pricing rules
- **Tax Category** - Tax classification

## 🛒 Selling
- **Quotation** - Sales quotations
- **Sales Order** - Customer orders
- **Customer Group** - Customer segmentation
- **Territory** - Sales territory management
- **Lead** - Sales leads
- **Opportunity** - Sales opportunities

## 📥 Buying
- **Supplier Group** - Supplier segmentation
- **Supplier Quotation** - Supplier quotes
- **Purchase Order** - Purchase orders

## 🏭 Manufacturing
- **BOM** - Bill of Materials
- **Work Order** - Production orders
- **Job Card** - Work order execution
- **Routing** - Production routing
- **Production Plan** - Production planning

## 👷 HR & Payroll
- **Employee** - Employee master data
- **Department** - Organizational departments
- **Designation** - Job positions
- **Attendance** - Employee attendance
- **Leave Application** - Leave requests
- **Leave Type** - Types of leave
- **Salary Structure** - Salary components
- **Salary Slip** - Payroll processing
- **Expense Claim** - Employee expense claims

## 📊 Projects
- **Project** - Project management
- **Task** - Project tasks
- **Timesheet** - Time tracking
- **Activity Cost** - Project cost tracking

## 🏢 CRM
- **Campaign** - Marketing campaigns
- **Contact** - Contact management

## ⚙️ Website / Portal
- **Web Page** - Website pages
- **Blog Post** - Blog content
- **Blog Category** - Blog categorization
- **Web Form** - Online forms
- **Web Template** - Website templates

## 🔧 System & Configuration
- **Permission** - Access control
- **Workflow** - Business process automation
- **Custom Field** - Custom field definitions
- **Print Format** - Document printing templates
- **Letter Head** - Company letterheads
- **Address** - Address management
- **Communication** - Communication records
- **Email Queue** - Email processing queue
- **Error Log** - System error logging
- **Scheduled Job Type** - Background job types
- **Scheduled Job Log** - Background job execution logs
- **System Settings** - System configuration
- **Global Defaults** - Default values
- **Company** - Company information
- **Fiscal Year** - Financial year settings
- **Cost Center** - Cost center management
- **Account** - Chart of accounts
- **Party Type** - Party type definitions
- **UOM** - Unit of measure
- **Brand** - Product brands
- **Item Attribute** - Product attributes
- **Item Attribute Value** - Attribute values
- **Price List** - Price list management
- **Shipping Rule** - Shipping configuration
- **Sales Taxes and Charges Template** - Tax templates
- **Purchase Taxes and Charges Template** - Purchase tax templates
- **Sales Person** - Sales personnel
- **Sales Team** - Sales team management
- **Sales Partner** - Sales partner management

## 🏥 Healthcare (if Healthcare module is installed)
- **Appointment** - Medical appointments
- **Patient** - Patient records
- **Patient Appointment** - Patient scheduling
- **Patient Encounter** - Patient visits
- **Vital Signs** - Patient vital signs
- **Clinical Procedure** - Medical procedures
- **Lab Test** - Laboratory tests
- **Lab Test Template** - Test templates
- **Sample Collection** - Sample collection
- **Sample** - Laboratory samples
- **Lab Test Sample** - Test samples
- **Lab Test UOM** - Test units
- **Lab Test Normal Range** - Normal value ranges
- **Lab Test Group** - Test groupings
- **Lab Test Name** - Test names
- **Lab Test Unit** - Test units

## Usage Tips

1. **GET Requests**: Use to fetch existing records
2. **POST Requests**: Use to create new records
3. **PUT Requests**: Use to update existing records
4. **DELETE Requests**: Use to delete records

## API Endpoints

All doctypes follow the pattern:
- `GET /api/resource/{doctype}` - List records
- `GET /api/resource/{doctype}/{name}` - Get specific record
- `POST /api/resource/{doctype}` - Create new record
- `PUT /api/resource/{doctype}/{name}` - Update record
- `DELETE /api/resource/{doctype}/{name}` - Delete record

## Common Parameters

- `limit` - Number of records to return
- `offset` - Starting position for pagination
- `filters` - Filter conditions
- `fields` - Specific fields to return
- `order_by` - Sort order
