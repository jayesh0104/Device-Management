const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const app = express();
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
app.use(express.static('node_modules'));


app.use(express.static(__dirname + '/public'));



app.use(flash());
app.use(session({
  secret: 'ABC',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Add this line to enable authentication
app.use(require('connect-flash')());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/device-management', { useNewUrlParser: true, useUnifiedTopology: true });

const deviceSchema = new mongoose.Schema({
  name: String,
  variant: String,
  quantity: Number,
  allocatedTo: { type: String, ref: 'Employee' },
  requestedBy: { type: String, ref: 'Employee' },
  reason:String,
  approvedOrRejected:String,
});

const meetingSchema= new mongoose.Schema({
  name:{type:String,required:true},
  empId:{type:String,required:true},
  requestedWith:{type:String,required:true},
  reason:{type:String,required:true},
  date:{type:Date,required:true},
  approved:{type:String,default:"Not Approved"},
  approvedBy:{type:String}
})
const employeeSchema = new mongoose.Schema({
  allocatedTo : { type: String, unique: true },
  name: String,
  password: String
})

const Admin = mongoose.model('Admin', new mongoose.Schema({
  username : String,
  password: String,
  // Other admin data can be added here
}));
const Director = mongoose.model('Director', new mongoose.Schema({
  username : String,
  password: String,
  // Other admin data can be added here
}));

const userSchema = new mongoose.Schema({
  username : { type: String, unique: true, required: true },
  name: String,
  role:{
    type:String,
    default:"employee"
  },
});

const eventSchema = new mongoose.Schema({
  name:{type:String,unique:true,required:true},
  date:{type:Date,required:true},
  venue:{type:String,required:true},
  coordinator:{type:String,required:true},
  eventDetails:{type:String,required:true},
  empId:{type:String,required:true},
  approved:{type:String,default:"Not Approved"},
  approvedBy:{type:String,default:""},
  image: {type: String,required: false}
});


const Device = mongoose.model('Device', deviceSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
const Meeting = mongoose.model('Meeting',meetingSchema);

app.get('/', async (req, res) => {
  try {
    const events = await Event.find({ approved: "Approved" });
    res.render('index', { events });
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while fetching events');
    res.redirect('/'); // Redirect to homepage or handle the error appropriately
  }
});

const saltRounds = 10;
const hashedPassword = bcrypt.hashSync('password', saltRounds);

const admin = { username: 'admin', password: hashedPassword };

app.get('/admin', (req, res) => {
    res.render('admin');
});
  
  // Add logging statements to help debug
app.post('/admin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      req.flash('error_msg', 'Incorrect username or password');
      return res.redirect('/admin');
    }

    // Log the admin object to see if it's fetched correctly
    console.log('Admin:', admin);

    req.session.admin = admin;
    console.log('Admin session:', req.session.admin); // Log the session admin object
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred');
    res.redirect('/admin');
  }
});

app.get('/admin-panel', async (req, res) => {
  if (!req.session.admin) {
    req.flash('error_msg', 'Unauthorized access');
    return res.redirect('/admin');
  }

  try {
    const devices = await Device.find({});
    const employees = await Employee.find({});
    const events = await Event.find({});
    const leaves = await Leave.find({});
    const bill = await Bill.find({});
    const meeting = await Meeting.find({requestedWith:"Registrar"});
    const uniqueDevices = new Set();
    devices.forEach(device => {
      uniqueDevices.add(device.name);
    });
    const unique = Array.from(uniqueDevices);
    res.render('admin-panel', { devices, employees, unique ,events,leaves,bill,meeting});
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while fetching devices or employees');
    res.redirect('/admin-panel');
  }
});

const PDFDocument = require('pdfkit');
const fs = require('fs');
const { Console } = require('console');

app.get('/admin-panel/report', async (req, res) => {
  try {
    // Calculate the number of devices allocated to each employee
    const deviceCountsByEmployee = await Device.aggregate([
      { $match: { allocatedTo: { $ne: null } } },
      { $group: { _id: '$allocatedTo', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Generate a PDF report with the device counts
    const doc = new PDFDocument;
    const filename = 'device-report.pdf';
    const stream = fs.createWriteStream(filename);

    doc.pipe(stream);

    doc.fontSize(12)
      .text('Device Allocation Report', { align: 'center' })
      .moveDown()
      .lineWidth(1)
      .text('Employee ID', { align: 'left' })
      .text('Device Name', { align: 'center' })
      .text('Employee Name',{align:'right'})
      .text('-------------------------------------------------', { align: 'center' })
      .moveDown();

    for (const deviceCount of deviceCountsByEmployee) {
      const employee = await Employee.findOne({ allocatedTo: deviceCount._id });
      const devices = await Device.find({ allocatedTo: deviceCount._id });

      for (const device of devices) {
        doc.text(employee.allocatedTo, { align: 'left' })
          .text(employee.name,{ align: 'right' })
          .text(device.name, { align: 'center' })
          .moveDown();
      }

      doc.text('-------------------------------------------------', { align: 'center' })
        .moveDown();
    }

    doc.end();

    // Send the PDF report as a response to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    const buffers = [];
    stream.on('data', (data) => buffers.push(data));
    stream.on('end', () => {
    const pdfData = Buffer.concat(buffers);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(pdfData);
  });
  stream.on('finish', () => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  fs.createReadStream(filename).pipe(res);
});
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while generating the report');
    res.redirect('/admin-panel');
  }
});

app.post('/approve-device/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const { variant } = req.body;
  const d = await Device.findById(deviceId);
  console.log(d);
  try {
    const device = await Device.findByIdAndUpdate(deviceId, { variant, allocatedTo: d.requestedBy,approvedOrRejected:"Approved" }, { new: true });
    req.flash('success_msg', 'Device request approved successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while approving the device request');
    res.redirect('/admin-panel');
  }
});
app.post('/reject-device/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  try {
    const device = await Device.findByIdAndUpdate(deviceId,{approvedOrRejected:"Rejected"});
    req.flash('success_msg', 'Device request rejected successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while rejecting the device request');
    res.redirect('/admin-panel');
  }
});
app.post('/approve-meeting/:meetingId', async (req, res) => {
  const { meetingId } = req.params;
  try {
    const meeting = await Meeting.findByIdAndUpdate(meetingId, {approved:"Approved" }, { new: true });
    req.flash('success_msg', 'Meeting request approved successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while approving the device request');
    res.redirect('/admin-panel');
  }
});
app.post('/reject-meeting/:meetingId', async (req, res) => {
  const { meetingId } = req.params;

  try {
    const meeting = await meeting.findByIdAndUpdate(meetingId,{approved:"Rejected"});
    req.flash('success_msg', 'Device request rejected successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while rejecting the device request');
    res.redirect('/admin-panel');
  }
});
  
app.get('/employee', (req, res) => {
    res.render('employee');
});
app.get('/employee-panel', async (req, res) => {
  if (!req.session.admin) {
    req.flash('error_msg', 'Unauthorized access');
    return res.redirect('/employee');
  }

  try {
    const devices = await Device.find({ allocatedTo: req.session.admin.username });
    const employee = await Employee.findOne({ allocatedTo: req.session.admin.username });
    let events = await Event.find({ empId: req.session.admin.username });
    let leaves = await Leave.find({ employeeId: req.session.admin.username });
    let meeting = await Meeting.find({ empId: req.session.admin.username });
    let bill = await Bill.find({empId:req.session.admin.username});

    if (!employee) {
      req.flash('error', 'Employee not found');
      return res.redirect('/admin-panel');
    }

    // Sort events by date in descending order
    events = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    meeting = meeting.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    bill = bill.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log(leaves);
    res.render('employee-panel', { devices, employeeId: req.session.admin.username, employeeName: employee.name, events ,leaves,meeting,bill});
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while fetching devices or employee name');
    res.redirect('/employee-panel');
  }
});



app.post('/employee-login', async (req, res) => {
  const { employeeId, password } = req.body;

  if (!employeeId) {
    req.flash('error_msg', 'Employee ID is required');
    return res.redirect('/employee');
  }

  try {
    const employee = await Employee.findOne({ allocatedTo: employeeId });

    if (!employee) {
      req.flash('error_msg', 'Employee not found');
      return res.redirect('/employee');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);

    if (isPasswordValid) {
      req.session.admin = { username: employeeId };
      req.flash('success_msg', 'Login successful');
      res.redirect(`/employee-panel?employeeId=${employeeId}`);
    } else {
      req.flash('error_msg', 'Incorrect password');
      res.redirect('/employee');
    }
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while logging in');
    res.redirect('/employee');
  }
});


app.get('/employee-panel', async (req, res) => {
  const event = await Event.find({ empId: req.session.admin.username }).exec();
  console.log(event);
  Device.find({ allocatedTo: req.session.admin.username })
    .then((devices) => {
      res.render('employee-panel', { devices, employeeId: req.session.admin.username ,events: event});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error fetching devices');
    });
});

app.get('/employee-request', (req, res) => {
  const employeeId = req.query.employeeId;
  res.render('employee-request', { employeeId });
});

app.post('/request-device', async (req, res) => {
  const { deviceName, employeeId ,reason} = req.body;
  try {
    const device = new Device({
      name: deviceName,
      allocatedTo: '', // Set as empty string initially
      requestedBy: employeeId,
      reason: reason
    });

    await device.save();
    req.flash('success_msg', 'Device request submitted successfully');
    res.redirect(`/employee?employeeId=${employeeId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while submitting the device request');
    res.redirect('/request-device');
  }
});

app.post('/add-device', async (req, res) => {
  const { deviceName, variant, quantity, serialNumbers, employeeId } = req.body;

  try {
    // Check if the device already exists
    const existingDevice = await Device.findOne({ name: deviceName });

    if (existingDevice) {
      // If the device exists, update the quantity and serial numbers
      existingDevice.quantity += quantity;
      existingDevice.serialNumbers = existingDevice.serialNumbers.concat(serialNumbers);
      existingDevice.allocatedTo = employeeId;
      await existingDevice.save();
    } else {
      // If the device doesn't exist, create a new one
      const newDevice = new Device({
        name: deviceName,
        variant: variant.toUpperCase(),
        quantity: quantity,
        serialNumbers: serialNumbers,
        allocatedTo: employeeId
      });

      await newDevice.save();
    }

    req.flash('success_msg', 'Device added successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while adding the device');
    res.redirect('/add-device');
  }
});

app.post('/allocate', async (req, res) => {
  const { deviceName, employeeId, variant } = req.body;

  try {
    // Find the employee object by ID
    const employee = await Employee.findOne({ allocatedTo: employeeId });

    if (!employee) {
      req.flash('error_msg', 'Employee not found');
      return res.redirect('/admin-panel');
    }

    // Find the device by name and update it with the employee object and variant
    const device = await Device.findOneAndUpdate(
      { name: deviceName, allocatedTo: null },
      { allocatedTo: employee, variant: variant.toUpperCase() },
      { new: true }
    );

    if (!device) {
      req.flash('error_msg', 'Device not found or already allocated');
      return res.redirect('/admin-panel');
    }

    req.flash('success_msg', 'Device allocated successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while allocating the device');
    res.redirect('/admin-panel');
  }
});
  app.post('/logout', (req, res) => {
    res.redirect('/');
  });
  

  app.post('/request-device', (req, res) => {
    const device = new Device({ name: req.body.deviceName, allocatedTo: req.body.employeeId });
    device.save()
      .then(() => {
        res.redirect('/employee?employeeId=' + req.body.employeeId);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error adding device');
      });
  });

  app.get('/add-employee', (req, res) => {
    res.render('add-employee');
  });
  
  app.post('/add-employee', async (req, res) => {
    const { empId, name, password } = req.body;
  
    if (!empId || !name || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/add-employee');
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newEmployee = new Employee({ allocatedTo: empId, name, password: hashedPassword });
      await newEmployee.save();
  
      const newUser = new User({ username: empId, name });
      await newUser.save();
  
      req.flash('success_msg', 'Employee added successfully');
      res.redirect('/admin-panel');
    } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred while adding the employee');
      res.redirect('/add-employee');
    }
  });
  app.get('/device/:deviceName', async (req, res) => {
    const { deviceName } = req.params;
  
    try {
      // Find the device by name
      const device = await Device.find({ name: deviceName });
      
      if (!device) {
        req.flash('error_msg', 'Device not found');
        return res.redirect('/admin-panel');
      }
  
      // Find employees allocated to the device
      const employees = await Employee.find({ allocatedTo: { $in: device.allocatedTo } });

      // Render the template with device and employees data
      res.render('device-employees', { device});
    } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred while fetching device details');
      res.redirect('/admin-panel');
    }
  });
// Add this route handler for deleting allocation along with device details
app.post('/delete-allocation/:deviceId', async (req, res) => {
  const { deviceId } = req.params;

  try {
      // Find the device by ID and delete it
      await Device.findByIdAndDelete(deviceId);
      req.flash('success_msg', 'Allocation and device details deleted successfully');
      res.redirect('/admin-panel');
  } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred while deleting the allocation and device details');
      res.redirect('/admin-panel');
  }
});


//Route to handle event creation
app.get("/event-request",(req,res)=>{
  const employeeId = req.query.employeeId;
  res.render('event-req', { employeeId });
})
const multer = require('multer');
const upload = multer({ dest: 'event/' });

app.post('/event-request', upload.single('image'), async (req, res) => {
  const { name, date, time, venue, coordinator, eventdetails, employeeId } = req.body;
  const image = req.file;

  try {
    // Convert the time string to a number of milliseconds
    const [timeHours, timeMinutes] = time.split(':');
    const timeDate = new Date();
    timeDate.setHours(timeHours);
    timeDate.setMinutes(timeMinutes);

    // Merge the date and time into a single Date object
    const eventDate = new Date(date);
    eventDate.setHours(timeDate.getHours());
    eventDate.setMinutes(timeDate.getMinutes());

    const event = new Event({
      name: name,
      date: eventDate,
      venue: venue,
      coordinator: coordinator,
      empId: employeeId,
      eventDetails: eventdetails,
      image: image.path // Save the image path in the database
    });

    await event.save();
    req.flash('success_msg', 'Event request submitted successfully');
    res.redirect('/employee?employeeId=' + req.body.employeeId);
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while submitting the event request');
    res.redirect('/event-request');
  }
});

app.post('/delete-event/:eventName', async (req, res) => {
  const { eventName } = req.params;

  try {
      // Find the device by ID and delete it
      await Event.findOneAndDelete(eventName);
      req.flash('success_msg', 'Allocation and device details deleted successfully');
      res.redirect('/admin-panel');
  } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred while deleting the allocation and device details');
      res.redirect('/admin-panel');
  }
});

app.post('/approve-event/:eventName', async (req, res) => {
  const { eventName } = req.params;
  
  try {
    if (!req.session.admin || !req.session.admin.username) {
      throw new Error('Admin session not found or username not set');
    }
    
    const device = await Event.findOneAndUpdate(
      { name: eventName }, // Find the event by its name
      { approved: "Approved", approvedBy: req.session.admin.username }, // Update fields
      { new: true } // Return updated document
    );
    
    req.flash('success_msg', 'Event request approved successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while approving the event request');
    res.redirect('/admin-panel');
  }
});



/*leave request*/

const leaveSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  fromDate: { type: Date, required: true },
  tillDate: { type: Date, required: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  approved:{type:String,default:"Not Approved"},
  approvedBy:{type:String,default:""},
});

const Leave = mongoose.model('Leave', leaveSchema);
app.get('/leaverequest',async (req,res)=>{
  const employeeId = req.query.employeeId;
  const employee = await Employee.findOne({ allocatedTo: employeeId });
  console.log(employeeId, employee.name);
  res.render('leaverequest', { employeeId, employeeName: employee.name });
})
app.post('/leaverequest', async (req, res) => {
  const { employeeId, name, fromDate, tillDate, reason } = req.body;

  // Validate the form data
  if (!employeeId || !name || !fromDate || !tillDate || !reason) {
    return res.render('leaverequest', { error: 'All fields are required' });
  }

  // Save the leave request to the database
  const leave = new Leave({
    employeeId,
    name,
    fromDate,
    tillDate,
    reason,
  });

  try {
    await leave.save();
    res.redirect('/employee?employeeId=' + req.body.employeeId);
  } catch (err) {
    console.error(err);
    res.render('leaverequest', { error: 'An error occurred while saving the leave request' });
  }
});

app.post('/delete-leave/:leaveId', async (req, res) => {
  const { leaveId } = req.params;

  try {
      // Find the event by ID and delete it
      await Event.findByIdAndDelete(leaveId);
      req.flash('success_msg', 'Leave Request deleted successfully');
      res.redirect('/admin-panel');
  } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred while deleting the leave request');
      res.redirect('/admin-panel');
  }
});


app.post('/approve-leave/:leaveId', async (req, res) => {
  const { leaveId } = req.params;
  
  try {
    if (!req.session.admin || !req.session.admin.username) {
      throw new Error('Admin session not found or username not set');
    }
    
    const updatedLeave = await Leave.findByIdAndUpdate(
      leaveId,
      { approved: "Approved", approvedBy: req.session.admin.username },
      { new: true }
    );

    if (!updatedLeave) {
      console.error('Leave request not found for ID:', leaveId);
      throw new Error('Leave request not found');
    }

    req.flash('success_msg', 'Leave request approved successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while approving the leave request');
    res.redirect('/admin-panel');
  }
});


app.get('/admin/dateLeaves', async (req, res) => {
  try {
    // Fetch leave events from the database
    const leaves = await Leave.find({}, 'name fromDate tillDate');
    
    // Transform leave events into the required format for FullCalendar
    const events = leaves.map(leave => ({
      title: leave.name,
      start: leave.fromDate.toISOString(),
      end: leave.tillDate.toISOString()
    }));
    
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching leave events' });
  }
});

// meeting-request

app.get('/meeting-request',async (req,res)=>{
  const employeeId = req.query.employeeId;
  const employee = await Employee.findOne({ allocatedTo: employeeId });
  console.log(employeeId, employee.name);
  res.render('meeting-request', { employeeId, employeeName: employee.name });
});
app.get("/event-request",(req,res)=>{
  const employeeId = req.query.employeeId;
  res.render('event-req', { employeeId });
});

app.post('/meeting-request', async (req, res) => {
  const { name, employeeId,Date,withWhom,reason } = req.body;
  try {
    const meeting = new Meeting({
      name: name,
      empId: employeeId,
      date:Date,
      requestedWith: withWhom,
      reason: reason
    });

    await meeting.save();
    req.flash('success_msg', 'meeting request submitted successfully');
    res.redirect('/employee?employeeId=' + req.body.employeeId);
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while submitting the meeting request');
    res.redirect('/meeting-request');
  }
});

// employee-expenses
const billSchema = new mongoose.Schema({
  name: {type:String,required:true},
  date: {type:Date,required:true},
  type: {type:String,required:true},
  empId: {type:String,required:true},
  amount:{type:Number,required:true},
  expenditureDetails:{type:String,required:true},
  approved:{type:String,default:"Not Approved"},
  approvedBy:{type:String,default:""},
  image: {type: String,required: false}
});
const Bill =  mongoose.model('Bill',billSchema);
app.get('/applyReimbursement', async (req,res) => {
  const employeeId = req.query.employeeId;
  const employee = await Employee.findOne({ allocatedTo: employeeId });

  if (!employee) {
    // Handle the error here, e.g., redirect to an error page or render an error message
    req.flash('error', 'Employee not found');
    return res.redirect('/employee');
  }

  res.render('apply-reimbursements', { employeeId, employeeName: employee.name });
});
const bill = multer({ dest: 'bill/' });
app.use('/bill', express.static(__dirname + '/bill'));

app.post('/applyReimbursement', bill.single('image'), async (req, res) => {
  const { name, date, time,type,amount, expendituredetails, employeeId } = req.body;
  const imageBill = req.file;
  console.log(date,time);
  try {
    // Convert the time string to a number of milliseconds
    const [timeHours, timeMinutes] = time.split(':');
    const timeDate = new Date();
    timeDate.setHours(timeHours);
    timeDate.setMinutes(timeMinutes);

    // Merge the date and time into a single Date object
    const billDate = new Date(date);
    billDate.setHours(timeDate.getHours());
    billDate.setMinutes(timeDate.getMinutes());

    const bill = new Bill({
      name: name,
      date: billDate,
      type:type,
      amount:amount,
      empId: employeeId,
      expenditureDetails: expendituredetails,
      image: imageBill.path // Save the image path in the database
    });

    await bill.save();
    req.flash('success_msg', 'Reimbursement request submitted successfully');
    res.redirect('/employee?employeeId=' + req.body.employeeId);
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while submitting the reimbursement request');
    res.redirect('/applyReimbursement');
  }
});

app.post('/delete-reimbursement/:billID', async (req, res) => {
  const { billID } = req.params;

  try {
      // Find the device by ID and delete it
      await Bill.findByIdAndDelete(billID);
      req.flash('success_msg', 'Reimbursement details deleted successfully');
      res.redirect('/admin-panel');
  } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred while deleting the reimbursement details');
      res.redirect('/admin-panel');
  }
});

app.post('/approve-reimbursement/:billID', async (req, res) => {
  const { billID } = req.params;
  
  try {
    if (!req.session.admin || !req.session.admin.username) {
      throw new Error('Admin session not found or username not set');
    }
    
    const bill = await Bill.findByIdAndUpdate(
      { _id: billID }, // Find the event by its name
      { approved: "Approved", approvedBy: req.session.admin.username }, // Update fields
      { new: true } // Return updated document
    );
    
    req.flash('success_msg', 'Reimbursement request approved successfully');
    res.redirect('/admin-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while approving the reimbursement request');
    res.redirect('/admin-panel');
  }
});



/*-----director-panel----------*/
app.get('/director', (req, res) => {
  res.render('director');
});
const director = { username: 'director', password: hashedPassword };

app.post('/director-login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const director = await Director.findOne({ username });

    if (!director || !bcrypt.compareSync(password, director.password)) {
      req.flash('error_msg', 'Incorrect username or password');
      return res.redirect('/director');
    }

    req.session.director = director;
    res.redirect('/director-panel');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred');
    res.redirect('/director');
  }
});

app.get('/director-panel', async (req, res) => {
  if (!req.session.director) {
    req.flash('error_msg', 'Unauthorized access');
    return res.redirect('/director');
  }

  try {
    const devices = await Device.find({});
    const employees = await Employee.find({});
    const events = await Event.find({});
    const leaves = await Leave.find({});
    const bill = await Bill.find({});
    const meeting = await Meeting.find({requestedWith:"Director"});
    const uniqueDevices = new Set();
    devices.forEach(device => {
      uniqueDevices.add(device.name);
    });
    const unique = Array.from(uniqueDevices);
    res.render('director-panel', { devices, employees, unique ,events,leaves,bill,meeting});
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while fetching devices or employees');
    res.redirect('/director-panel');
  }
});
app.get('/director-logout', (req, res) => {
  req.session.director = null;
  res.redirect('/');
});
app.get('/add-admin', (req, res) => {
  res.render('add-admin');
});

app.post('/add-admin', async (req, res) => {
  const { empId,name, password } = req.body;

  if (!empId ||!name|| !password) {
    req.flash('error', 'All fields are required');
    return res.redirect('/director-panel');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newAdmin = new Admin({ username: empId, password: hashedPassword });
    await newAdmin.save();

    const newUser = new User({ username: empId, name });
    await newUser.save();

    req.flash('success_msg', 'Employee added successfully');
    res.redirect('/director-panel');
  } catch (err) {
    console.error(err);
    req.flash('error', 'An error occurred while adding the employee');
    res.redirect('/add-admin');
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});