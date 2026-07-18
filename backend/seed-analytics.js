const mongoose = require('mongoose');

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://admin:admin123@localhost:27017/cloudedtech?authSource=admin');
    console.log('Connected!');

    const db = mongoose.connection.db;

    // Get the first user
    const users = await db.collection('users').find({}).toArray();
    if (users.length === 0) {
      console.log('No users found. Please register a user first.');
      process.exit(0);
    }
    
    // Pick the most recently created user or a specific test user
    const user = users[users.length - 1];
    const userId = user._id.toString();
    console.log(`Seeding analytics for user: ${user.email} (${userId})`);

    const events = [
      {
        userId,
        videoId: 'react-basics',
        eventType: 'stream_start',
        eventData: {},
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId,
        videoId: 'react-basics',
        eventType: 'stream_end',
        eventData: {},
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 45), // + 45 mins
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId,
        videoId: 'react-hooks',
        eventType: 'stream_start',
        eventData: {},
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId,
        videoId: 'react-hooks',
        eventType: 'quality_change',
        eventData: { quality: '1080p' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 + 1000 * 60 * 5), // + 5 mins
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId,
        videoId: 'react-hooks',
        eventType: 'stream_end',
        eventData: {},
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1 + 1000 * 60 * 30), // + 30 mins
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId,
        videoId: 'node-basics',
        eventType: 'stream_start',
        eventData: {},
        timestamp: new Date(), // just now
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await db.collection('analytics_events').insertMany(events);
    console.log('Successfully seeded analytics events!');

  } catch (err) {
    console.error('Error seeding:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
