import fs from 'fs';

const file = 'E:/file rivan/Bootcamp/KADA-BATCH-4/Eleva-Capstone/eleva-backend/postman/sentinel_api.postman_collection.json';
const data = fs.readFileSync(file, 'utf8');
const collection = JSON.parse(data);

// 1. UPDATE VENDORS FOLDER
const vendorsFolder = collection.item.find(i => i.name === 'Vendors');
if (vendorsFolder) {
  const createVendor = {
    "name": "Create Vendor",
    "request": {
      "method": "POST",
      "header": [],
      "body": {
        "mode": "raw",
        "raw": "{\n  \"vendor_name\": \"PT Sejahtera Bersama\",\n  \"bank_account\": \"BCA 12345678\",\n  \"status\": \"active\"\n}",
        "options": { "raw": { "language": "json" } }
      },
      "url": { "raw": "{{baseUrl}}/vendors", "host": ["{{baseUrl}}"], "path": ["vendors"] }
    }
  };

  const getVendorById = {
    "name": "Get Vendor by ID",
    "request": {
      "method": "GET",
      "header": [],
      "url": { "raw": "{{baseUrl}}/vendors/1", "host": ["{{baseUrl}}"], "path": ["vendors", "1"] }
    }
  };

  const updateVendor = {
    "name": "Update Vendor",
    "request": {
      "method": "PUT",
      "header": [],
      "body": {
        "mode": "raw",
        "raw": "{\n  \"vendor_name\": \"PT Sejahtera Terus\",\n  \"status\": \"inactive\"\n}",
        "options": { "raw": { "language": "json" } }
      },
      "url": { "raw": "{{baseUrl}}/vendors/1", "host": ["{{baseUrl}}"], "path": ["vendors", "1"] }
    }
  };

  if (!vendorsFolder.item.find(i => i.name === 'Create Vendor')) vendorsFolder.item.push(createVendor);
  if (!vendorsFolder.item.find(i => i.name === 'Get Vendor by ID')) vendorsFolder.item.push(getVendorById);
  if (!vendorsFolder.item.find(i => i.name === 'Update Vendor')) vendorsFolder.item.push(updateVendor);
}

// 2. UPDATE TRANSACTIONS FOLDER
const txFolder = collection.item.find(i => i.name === 'Transactions');
if (txFolder) {
  // Remove the old "Create Transaction"
  txFolder.item = txFolder.item.filter(i => i.name !== 'Create Transaction');

  const createB2B = {
    "name": "Create Transaction (B2B Sales)",
    "request": {
      "method": "POST",
      "header": [],
      "body": {
        "mode": "raw",
        "raw": "{\n  \"transaction_date\": \"2024-03-05T10:00:00Z\",\n  \"amount\": 5000000.00,\n  \"type\": \"income\",\n  \"category\": \"B2B Sales\",\n  \"description\": \"Penjualan B2B ke vendor 1\",\n  \"vendor_id\": 1,\n  \"input_by_user_id\": 1\n}",
        "options": { "raw": { "language": "json" } }
      },
      "url": { "raw": "{{baseUrl}}/transactions", "host": ["{{baseUrl}}"], "path": ["transactions"] }
    }
  };

  const createRetail = {
    "name": "Create Transaction (Retail Sales - No Vendor)",
    "request": {
      "method": "POST",
      "header": [],
      "body": {
        "mode": "raw",
        "raw": "{\n  \"transaction_date\": \"2024-03-06T10:00:00Z\",\n  \"amount\": 150000.00,\n  \"type\": \"income\",\n  \"category\": \"Sales\",\n  \"description\": \"Penjualan ritel tunai\",\n  \"input_by_user_id\": 1\n}",
        "options": { "raw": { "language": "json" } }
      },
      "url": { "raw": "{{baseUrl}}/transactions", "host": ["{{baseUrl}}"], "path": ["transactions"] }
    }
  };

  const createPayroll = {
    "name": "Create Transaction (Payroll - No Vendor)",
    "request": {
      "method": "POST",
      "header": [],
      "body": {
        "mode": "raw",
        "raw": "{\n  \"transaction_date\": \"2024-03-25T10:00:00Z\",\n  \"amount\": 8000000.00,\n  \"type\": \"expense\",\n  \"category\": \"Payroll & Benefits\",\n  \"description\": \"Pembayaran gaji bulan Maret\",\n  \"input_by_user_id\": 1\n}",
        "options": { "raw": { "language": "json" } }
      },
      "url": { "raw": "{{baseUrl}}/transactions", "host": ["{{baseUrl}}"], "path": ["transactions"] }
    }
  };

  if (!txFolder.item.find(i => i.name === 'Create Transaction (B2B Sales)')) txFolder.item.push(createB2B);
  if (!txFolder.item.find(i => i.name === 'Create Transaction (Retail Sales - No Vendor)')) txFolder.item.push(createRetail);
  if (!txFolder.item.find(i => i.name === 'Create Transaction (Payroll - No Vendor)')) txFolder.item.push(createPayroll);
}

fs.writeFileSync(file, JSON.stringify(collection, null, 2));
console.log('Successfully updated Postman collection with Vendor CRUD and Transaction examples.');
