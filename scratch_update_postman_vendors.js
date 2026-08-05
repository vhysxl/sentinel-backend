import fs from 'fs';

const file = 'E:/file rivan/Bootcamp/KADA-BATCH-4/Eleva-Capstone/eleva-backend/postman/sentinel_api.postman_collection.json';
const data = fs.readFileSync(file, 'utf8');
const collection = JSON.parse(data);

const vendorsFolder = {
  "name": "Vendors",
  "description": "Endpoints to manage vendors.",
  "item": [
    {
      "name": "List Vendors",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/vendors",
          "host": ["{{baseUrl}}"],
          "path": ["vendors"]
        }
      }
    }
  ]
};

// Check if it already exists to prevent duplicates
const exists = collection.item.find(i => i.name === 'Vendors');
if (exists) {
  console.log('Vendors folder already exists.');
} else {
  // Insert before Guards
  const guardsIdx = collection.item.findIndex(i => i.name === 'Guards');
  if (guardsIdx !== -1) {
    collection.item.splice(guardsIdx, 0, vendorsFolder);
  } else {
    collection.item.push(vendorsFolder);
  }
  
  fs.writeFileSync(file, JSON.stringify(collection, null, 2));
  console.log('Successfully added Vendors to Postman collection.');
}
