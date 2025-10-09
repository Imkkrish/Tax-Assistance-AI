// MongoDB initialization script
db = db.getSiblingDB('tax-assistant');

// Create application user
db.createUser({
  user: 'taxapp',
  pwd: 'taxapp123',
  roles: [
    { role: 'readWrite', db: 'tax-assistant' }
  ]
});

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "pan": 1 }, { sparse: true });
db.taxdocuments.createIndex({ "user": 1, "financialYear": 1 });
db.taxdocuments.createIndex({ "processingStatus": 1 });
db.taxcalculations.createIndex({ "user": 1, "financialYear": 1 });
db.taxcalculations.createIndex({ "status": 1 });
db.aiqueries.createIndex({ "user": 1, "createdAt": -1 });
db.aiqueries.createIndex({ "sessionId": 1 });

console.log('Database initialized successfully');