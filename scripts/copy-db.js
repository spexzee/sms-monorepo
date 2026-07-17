const mongoose = require('mongoose');

const oldUri = '';
const newUri = 's';

async function main() {
  console.log('Connecting to old database...');
  const oldConn = await mongoose.createConnection(oldUri).asPromise();
  console.log('Connected to old database successfully!');

  console.log('Connecting to new database...');
  const newConn = await mongoose.createConnection(newUri).asPromise();
  console.log('Connected to new database successfully!');

  const collectionsToCopy = ['menus', 'roles'];

  for (const collName of collectionsToCopy) {
    console.log(`\n--- Starting copy for collection: ${collName} ---`);
    
    const oldColl = oldConn.collection(collName);
    const newColl = newConn.collection(collName);

    console.log(`Fetching documents from old database's "${collName}"...`);
    const docs = await oldColl.find({}).toArray();
    console.log(`Found ${docs.length} documents in old database's "${collName}".`);

    if (docs.length === 0) {
      console.log(`No documents found in old "${collName}". Skipping copy.`);
      continue;
    }

    console.log(`Clearing existing documents in new database's "${collName}"...`);
    const deleteResult = await newColl.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing documents in new "${collName}".`);

    console.log(`Inserting ${docs.length} documents into new database's "${collName}"...`);
    const insertResult = await newColl.insertMany(docs);
    console.log(`Successfully inserted ${insertResult.insertedCount} documents into new "${collName}".`);
  }

  console.log('\nClosing database connections...');
  await Promise.all([oldConn.close(), newConn.close()]);
  console.log('Connections closed. Migration completed successfully!');
}

main().catch(err => {
  console.error('Error during database copy migration:', err);
  process.exit(1);
});
