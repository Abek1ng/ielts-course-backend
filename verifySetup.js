require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const verifySetup = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check for admin user
    const admin = await User.findOne({ isAdmin: true });
    if (admin) {
      console.log('Admin user exists:', admin.email);
    } else {
      console.log('No admin user found');
    }

    // Check for regular users
    const users = await User.find({ isAdmin: false });
    console.log('Regular users count:', users.length);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Verification failed:', error);
  }
};

verifySetup();