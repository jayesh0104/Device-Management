const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const employeeSchema = new mongoose.Schema({
  allocatedTo: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
});

module.exports = mongoose.model('Employee', employeeSchema);