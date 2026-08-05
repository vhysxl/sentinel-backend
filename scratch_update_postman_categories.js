import fs from 'fs';

const file = 'E:/file rivan/Bootcamp/KADA-BATCH-4/Eleva-Capstone/eleva-backend/postman/sentinel_api.postman_collection.json';
const data = fs.readFileSync(file, 'utf8');
const collection = JSON.parse(data);

const listCategoriesRequest = {
  "name": "List Categories",
  "request": {
    "method": "GET",
    "header": [],
    "url": {
      "raw": "{{baseUrl}}/transactions/categories",
      "host": ["{{baseUrl}}"],
      "path": ["transactions", "categories"]
    },
    "description": "Returns standard business categories. Pass `?type=income` or `?type=expense` to filter."
  }
};

const transactionsFolder = collection.item.find(i => i.name === 'Transactions');
if (transactionsFolder) {
  const exists = transactionsFolder.item.find(i => i.name === 'List Categories');
  if (exists) {
    console.log('List Categories already exists in Postman.');
  } else {
    // Insert after "List Transactions"
    const listIndex = transactionsFolder.item.findIndex(i => i.name === 'List Transactions');
    if (listIndex !== -1) {
      transactionsFolder.item.splice(listIndex + 1, 0, listCategoriesRequest);
    } else {
      transactionsFolder.item.push(listCategoriesRequest);
    }
    fs.writeFileSync(file, JSON.stringify(collection, null, 2));
    console.log('Successfully added List Categories to Transactions folder.');
  }
} else {
  console.log('Transactions folder not found!');
}
