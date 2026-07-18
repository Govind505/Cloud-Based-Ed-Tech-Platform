const mongoose = require('mongoose');

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:admin123@127.0.0.1:27017/cloudedtech?authSource=admin';
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    const db = mongoose.connection.db;
    
    const collections = [
      'users',
      'videos',
      'courses',
      'modules',
      'lessons',
      'quizzes',
      'progresses',
      'submissions',
      'chatrooms',
      'chatmessages',
      'notifications',
      'analytics_events'
    ];

    console.log('Clearing database collections for deployment...');

    for (const colName of collections) {
      try {
        const count = await db.collection(colName).countDocuments();
        if (count > 0) {
          await db.collection(colName).deleteMany({});
          console.log(`✓ Cleared collection: ${colName} (${count} documents removed)`);
        } else {
          console.log(`- Collection ${colName} is already empty`);
        }
      } catch (colErr) {
        // Collection might not exist yet, which is fine
        console.log(`- Collection ${colName} does not exist or could not be cleared`);
      }
    }

    console.log('Database successfully cleared and prepared for deployment!');
  } catch (err) {
    console.error('Error clearing database:', err);
  } finally {
    await mongoose.disconnect();
  }
}

clearDatabase();
