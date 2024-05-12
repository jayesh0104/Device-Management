const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/device-management', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['admin', 'employee', 'director'], required: true },
});

const Admin = mongoose.model('Admin', UserSchema);
const Employee = mongoose.model('Employee', UserSchema);
const Director = mongoose.model('Director', UserSchema);

const saltRounds = 10; // Number of salt rounds for bcrypt

// Admin and employee data to be stored
const usersData = [
  { username: 'admin1', password: 'admin1', userType: 'admin' },
  { username: 'admin2', password: 'admin2', userType: 'admin' },
  { username: 'employee1', password: 'employee1', userType: 'employee' },
  { username: 'employee2', password: 'employee2', userType: 'employee' },
  { username: 'director1', password: 'director1', userType: 'director' },
  { username: 'director2', password: 'director2', userType: 'director' },
];

Promise.all(
  usersData.map(async (userData) => {
    try {
      if (userData.userType === 'admin') {
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        userData.password = hashedPassword;
        const admin = new Admin(userData);
        await admin.save();
        console.log(`Admin ${userData.username} saved successfully.`);
      } else if (userData.userType === 'employee') {
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        userData.password = hashedPassword;
        const employee = new Employee(userData);
        await employee.save();
        console.log(`Employee ${userData.username} saved successfully.`);
      } else if (userData.userType === 'director') {
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        userData.password = hashedPassword;
        const director = new Director(userData);
        await director.save();
        console.log(`Director ${userData.username} saved successfully.`);
      } else {
        console.error(`Invalid userType: ${userData.userType}`);
      }
    } catch (error) {
      console.error(`Error saving user ${userData.username}:`, error);
    }
  })
).then(() => {
  console.log('All users saved successfully.');
  mongoose.disconnect(); // Close MongoDB connection after saving all users
}).catch(error => {
  console.error('Error saving users:', error);
});