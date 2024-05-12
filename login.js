const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to the database
mongoose.connect('mongodb://localhost:27017/device-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import the models
const Admin = require('./models/Admin');
const Employee = require('./models/Employee');
const Director = require('./models/Director');

const saltRounds = 10;

// Create an admin user
const hashedPassword = bcrypt.hashSync('test', saltRounds);
const admin = new Admin({
  username: 'test',
  password: hashedPassword,
});

admin.save();

  // Create an employee user
  const employeePassword = bcrypt.hashSync('test', saltRounds);
  const employee = new Employee({
    allocatedTo: 'test1',
    name: 'Employee One',
    password: employeePassword,
  });

  employee.save();

    // Create a director user
    const directorPassword = bcrypt.hashSync('test', saltRounds);
    const director = new Director({
      username: 'test',
      password: directorPassword,
    });

    director.save();