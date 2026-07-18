const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:admin123@127.0.0.1:27017/cloudedtech?authSource=admin';
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    const db = mongoose.connection.db;

    // 1. Seed Users
    console.log('Checking users...');
    const userCount = await db.collection('users').countDocuments();
    let userId;
    
    if (userCount === 0) {
      console.log('No users found. Creating default users...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const defaultUsers = [
        {
          email: 'student@cloudedtech.com',
          firstName: 'Sarah',
          lastName: 'Chen',
          password: hashedPassword,
          role: 'student',
          isActive: true,
          emailVerified: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
          bio: 'Aspiring Frontend Developer',
          subscriptionTier: 'free',
          enrolledCourses: [
            { courseId: 'react-basics', title: 'React Basics', progress: 15, image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800' },
            { courseId: 'python-beginners', title: 'Python for Beginners', progress: 0, image: 'https://images.unsplash.com/photo-1649180556628-9ba704115795?w=800' }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
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
        }
      ];

      const result = await db.collection('users').insertMany(defaultUsers);
      userId = result.insertedIds[0].toString();
      console.log('Default users created successfully.');
    } else {
      const existingUser = await db.collection('users').findOne({});
      userId = existingUser._id.toString();
      console.log('Users already exist in database.');
    }

    // 2. Seed Videos
    console.log('Checking videos...');
    const videoCount = await db.collection('videos').countDocuments();
    
    if (videoCount === 0) {
      console.log('No videos found. Creating sample videos...');
      const sampleVideos = [
        {
          title: 'React Basics - Introduction to JSX',
          description: 'Learn the fundamentals of JSX, components, and how React renders elements under the hood.',
          courseId: 'react-basics',
          uploadedBy: userId,
          duration: 234, // in seconds
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
          status: 'ready',
          originalUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          fileSize: 15420000,
          resolution: '1280x720',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
          updatedAt: new Date()
        },
        {
          title: 'Python for Beginners - Control Flow',
          description: 'Master if-else statements, for/while loops, and nested logical conditions in Python.',
          courseId: 'python-beginners',
          uploadedBy: userId,
          duration: 312,
          thumbnail: 'https://images.unsplash.com/photo-1649180556628-9ba704115795?w=800',
          status: 'ready',
          originalUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          fileSize: 18450000,
          resolution: '1280x720',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          updatedAt: new Date()
        },
        {
          title: 'AWS Cloud Intro - EC2 Foundations',
          description: 'Deploy your first virtual server in the cloud and configure security groups correctly.',
          courseId: 'aws-cloud',
          uploadedBy: userId,
          duration: 450,
          thumbnail: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=800',
          status: 'ready',
          originalUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
          fileSize: 24500000,
          resolution: '1280x720',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // 1 day ago
          updatedAt: new Date()
        }
      ];

      await db.collection('videos').insertMany(sampleVideos);
      console.log('Sample videos created successfully.');
    } else {
      console.log('Videos already exist in database.');
    }

    console.log('Database seeding checks completed successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
