const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/docnearyou', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const adminSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
  try {
    console.log('\n=== Creating Admin User ===\n');

    // Delete existing admin
    const deleted = await Admin.deleteMany({ email: 'admin@docnearyou.com' });
    if (deleted.deletedCount > 0) {
      console.log('✓ Deleted existing admin');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    console.log('Credentials:');
    console.log('  Email: admin@docnearyou.com');
    console.log('  Password: admin123');
    console.log('  Hashed:', hashedPassword.substring(0, 20) + '...');

    // Create admin
    const admin = await Admin.create({
      username: 'admin',
      email: 'admin@docnearyou.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('\n✅ Admin created successfully!');
    console.log('  ID:', admin._id);
    console.log('  Username:', admin.username);
    console.log('  Email:', admin.email);
    console.log('\n🔐 You can now login with:');
    console.log('  Email: admin@docnearyou.com');
    console.log('  Password: admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();