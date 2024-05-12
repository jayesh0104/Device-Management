// const bcrypt = require('bcrypt');
// const mongoose = require('mongoose');

// mongoose.connect('mongodb://localhost:27017/device-management', { useNewUrlParser: true, useUnifiedTopology: true });

// const Employee = mongoose.model('Employee', new mongoose.Schema({
//   allocatedTo: Number,
//   password: String,
//   // Other employee data can be added here
// }));

// const saltRounds = 10; // Number of salt rounds for bcrypt

// // Employee data to be stored
// const employeesData = [
//   { allocatedTo: 1, password: 'emp1' },
//   {allocatedTo: 2, password: 'emp2'},
//   {allocatedTo: 3, password: 'emp3'},
//   {allocatedTo: 4, password: 'emp4'}
// ];
// Promise.all(
//   employeesData.map(async (employeeData) => {
//     try {
//       const hashedPassword = await bcrypt.hash(employeeData.password, saltRounds);
//       const employee = new Employee({
//         allocatedTo: employeeData.allocatedTo,
//         password: hashedPassword,
//         // Add other employee data here
//       });
//       await employee.save();
//       console.log(`Employee ${employeeData.allocatedTo} saved successfully.`);
//     } catch (error) {
//       console.error(`Error saving employee ${employeeData.allocatedTo}:`, error);
//     }
//   })
// ).then(() => {
//   console.log('All employees saved successfully.');
//   mongoose.disconnect(); // Close MongoDB connection after saving all employees
// }).catch(error => {
//   console.error('Error saving employees:', error);
// });


const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/device-management', { useNewUrlParser: true, useUnifiedTopology: true });

const Employee = mongoose.model('Employee', new mongoose.Schema({
  allocatedTo: String,
  name: String,
  password: String,
  // Other employee data can be added here
}));

const User = mongoose.model('User', new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  // Other user data can be added here
}));

const saltRounds = 10; // Number of salt rounds for bcrypt

// Employee data to be stored
const employeesData = [
  { allocatedTo: 'emp1', name: 'Raju',password: 'emp1' },
  {allocatedTo: 'emp2', name: 'Deepak',password: 'emp2'},
  {allocatedTo: 'emp3',name: 'Sai', password: 'emp3'},
  {allocatedTo: 'emp4', name: 'Rahul',password: 'emp4'}
];

Promise.all(
  employeesData.map(async (employeeData, index) => {
    try {
      const hashedPassword = await bcrypt.hash(employeeData.password, saltRounds);
      const employee = new Employee({
        allocatedTo: employeeData.allocatedTo,
        name:employeeData.name,
        password: hashedPassword,
        // Add other employee data here
      });
      await employee.save();
      
      // Save employee details in users collection with role 'employee'
      const user = new User({
        username: `emp${index + 1}`,
        name: employeesData.name,
        role: 'employee',
        // Add other user data here
      });
      await user.save();
      
      console.log(`Employee ${employeeData.allocatedTo} saved successfully.`);
    } catch (error) {
      console.error(`Error saving employee ${employeeData.allocatedTo}:`, error);
    }
  })
).then(() => {
  console.log('All employees saved successfully.');
  mongoose.disconnect(); // Close MongoDB connection after saving all employees
}).catch(error => {
  console.error('Error saving employees:', error);
});