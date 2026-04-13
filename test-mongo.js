const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://Vaibhav:12345678%4012@cluster0.epj1sr.mongodb.net/piros";
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
client.connect()
  .then(() => {
     console.log('✅ DIRECT ATLAS CONNECTION SUCCESSFUL!');
     process.exit(0);
   })
  .catch(e => {
     console.log('❌ ATLAS CONNECTION FAILED:', e.message);
     process.exit(1);
   });
