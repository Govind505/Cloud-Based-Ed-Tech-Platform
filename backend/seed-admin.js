const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:admin123@127.0.0.1:27017/cloudedtech?authSource=admin';
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const adminUser = {
      email: 'admin@cloudedtech.com',
      firstName: 'Alex',
      lastName: 'Rivera',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      bio: 'Senior Infrastructure Engineer',
      subscriptionTier: 'premium',
      enrolledCourses: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // check if admin exists
    const existing = await db.collection('users').findOne({ email: 'admin@cloudedtech.com' });
    if (!existing) {
      await db.collection('users').insertOne(adminUser);
      console.log('Admin user created successfully.');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
seedAdmin();
