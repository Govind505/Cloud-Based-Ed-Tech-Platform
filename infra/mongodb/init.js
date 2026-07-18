db = db.getSiblingDB('cloudedtech');
db.createUser({
  user: 'cloudedtech-user',
  pwd: 'cloudedtech-password',
  roles: [
    { role: 'readWrite', db: 'cloudedtech' }
  ]
});

// Create collections and indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.createCollection('videos');
db.videos.createIndex({ courseId: 1 });
db.videos.createIndex({ uploadedBy: 1 });
db.videos.createIndex({ createdAt: -1 });
db.videos.createIndex({ status: 1 });

db.createCollection('encodings');
db.encodings.createIndex({ videoId: 1 });
db.encodings.createIndex({ quality: 1 });
db.encodings.createIndex({ status: 1 });
db.encodings.createIndex({ createdAt: -1 });

db.createCollection('streaming_sessions');
db.streaming_sessions.createIndex({ userId: 1 });
db.streaming_sessions.createIndex({ videoId: 1 });
db.streaming_sessions.createIndex({ startedAt: 1 });
db.streaming_sessions.createIndex({ endedAt: 1 });

db.createCollection('analytics');
db.analytics.createIndex({ userId: 1, videoId: 1 });
db.analytics.createIndex({ timestamp: 1 });
db.analytics.createIndex({ eventType: 1 });

print('✓ Cloud Based Ed-Tech Platform MongoDB initialized');
