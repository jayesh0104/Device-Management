// const bcrypt = require('bcrypt');
// const mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/device-management', { useNewUrlParser: true, useUnifiedTopology: true });

// const Admin = mongoose.model('Admin', new mongoose.Schema({
//   username: String,
//   name: String,
//   password: String,
//   // Other admin data can be added here
// }));

// const User = mongoose.model('User',new mongoose.Schema({
//   username : String,
//   name : String,
//   role : {
//     type:String,
//     default:'admin'
//   },
// }));

// const saltRounds = 10; // Number of salt rounds for bcrypt

// // Admin data to be stored
// const adminsData = [
//   { username: 'adm1', name: 'Admin1',password: 'admin1' },
//   {username: 'adm2', name: 'Admin2',password: 'admin2'},
//   {username: 'adm3', name: 'Admin3',password: 'admin3'},
//   {username: 'adm4', name: 'Admin4',password: 'admin4'}
// ];
// const userData=[
//   { username: 'adm1', name: 'Admin1'},
//   {username: 'adm2', name: 'Admin2'},
//   {username: 'adm3', name: 'Admin3'},
//   {username: 'adm4', name: 'Admin4'}
// ]
// Promise.all(
//   adminsData.map(async (adminData) => {
//     try {
//       const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
//       const admin = new Admin({
//         username: adminData.username,
//         password: hashedPassword,
//         // Add other admin data here
//       });
//       await admin.save();
//       console.log(`Admin ${adminData.username} saved successfully.`);
//     } catch (error) {
//       console.error(`Error saving admin ${adminData.username}:`, error);
//     }
//   })
// ).then(() => {
//   console.log('All admins saved successfully.');
//   mongoose.disconnect(); // Close MongoDB connection after saving all admins
// }).catch(error => {
//   console.error('Error saving admins:', error);
// });
// Promise.all(
//   adminsData.map(async (userData) => {
//     try {
//       const user = new User({
//         username: userData.username,
//         name: userData.name,
//         role: userData.role
//         // Add other admin data here
//       });
//       await user.save();
//       console.log(`Admin ${userData.username} saved successfully.`);
//     } catch (error) {
//       console.error(`Error saving admin ${userData.username}:`, error);
//     }
//   })
// ).then(() => {
//   console.log('All users saved successfully.');
//   mongoose.disconnect(); // Close MongoDB connection after saving all admins
// }).catch(error => {
//   console.error('Error saving users:', error);
// });

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/device-management', { useNewUrlParser: true, useUnifiedTopology: true });

const Admin = mongoose.model('Admin', new mongoose.Schema({
  username: String,
  name: String,
  password: String,
  // Other admin data can be added here
}));

const User = mongoose.model('User',new mongoose.Schema({
  username : String,
  name : String,
  role : {
    type:String,
    default:'admin'
  },
}));

const saltRounds = 10; // Number of salt rounds for bcrypt

// Admin data to be stored
const adminsData = [
  { username: 'adm1', name: 'Admin1',password: 'admin1' },
  {username: 'adm2', name: 'Admin2',password: 'admin2'},
  {username: 'adm3', name: 'Admin3',password: 'admin3'},
  {username: 'adm4', name: 'Admin4',password: 'admin4'}
];

Promise.all(
  adminsData.map(async (adminData) => {
    try {
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);
      const admin = new Admin({
        username: adminData.username,
        password: hashedPassword,
        // Add other admin data here
      });
      await admin.save();
      console.log(`Admin ${adminData.username} saved successfully.`);
    } catch (error) {
      console.error(`Error saving admin ${adminData.username}:`, error);
    }
  })
).then(() => {
  console.log('All admins saved successfully.');
}).catch(error => {
  console.error('Error saving admins:', error);
});

// Save user data
Promise.all(
  adminsData.map(async (userData) => {
    try {
      const user = new User({
        username: userData.username,
        name: userData.name,
        role: userData.role || 'admin' // Add default role if not provided
      });
      await user.save();
      console.log(`User ${userData.username} saved successfully.`);
    } catch (error) {
      console.error(`Error saving user ${userData.username}:`, error);
    }
  })
).then(() => {
  console.log('All users saved successfully.');
  mongoose.disconnect(); // Close MongoDB connection after saving all admins and users
}).catch(error => {
  console.error('Error saving users:', error);
  mongoose.disconnect(); // Close MongoDB connection in case of an error
});