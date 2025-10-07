const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 10000;

// Middleware
app.use(cors({
  origin: ['https://bitealert-frontend.onrender.com', 'https://bitealert-frontend-doga.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), fullscreen=(self), picture-in-picture=()');
  res.setHeader('Content-Security-Policy', "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; font-src *; img-src * data:; connect-src *; base-uri *; form-action *; object-src *;");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bitealert', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// ===== SCHEMAS =====

const biteCaseSchema = new mongoose.Schema({
  // ===== CORE PATIENT IDENTIFICATION =====
  patientId: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  philhealthNo: {
    type: String,
    required: false,
    default: ''
  },

  // ===== REGISTRATION & TIMING =====
  dateRegistered: {
    type: String,
    required: true
  },
  arrivalDate: {
    type: String,
    required: false,
    default: ''
  },
  arrivalTime: {
    type: String,
    required: false,
    default: ''
  },

  // ===== PATIENT PERSONAL INFORMATION =====
  firstName: {
    type: String,
    required: true
  },
  middleName: {
    type: String,
    required: false,
    default: ''
  },
  lastName: {
    type: String,
    required: true
  },
  civilStatus: {
    type: String,
    required: false,
    default: ''
  },
  birthdate: {
    type: String,
    required: false,
    default: ''
  },
  birthplace: {
    type: String,
    required: false,
    default: ''
  },
  nationality: {
    type: String,
    required: false,
    default: ''
  },
  religion: {
    type: String,
    required: false,
    default: ''
  },
  occupation: {
    type: String,
    required: false,
    default: ''
  },
  contactNo: {
    type: String,
    required: false,
    default: ''
  },

  // ===== ADDRESS INFORMATION =====
  houseNo: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  barangay: {
    type: String,
    required: true
  },
  subdivision: {
    type: String,
    required: false,
    default: ''
  },
  city: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },

  // ===== PHYSICAL CHARACTERISTICS =====
  age: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    required: true
  },
  sex: {
    type: String,
    required: true
  },
  center: {
    type: String,
    required: true
  },

  // ===== EXPOSURE DETAILS =====
  dateOfInquiry: {
    type: String,
    required: false,
    default: ''
  },
  timeOfInjury: {
    type: String,
    required: false,
    default: ''
  },
  typeOfExposure: {
    type: [String],
    default: [],
    enum: ['NON-BITE', 'BITE']
  },
  exposureDate: {
    type: String,
    required: false,
    default: ''
  },
  exposurePlace: {
    type: String,
    required: false,
    default: ''
  },
  exposureType: {
    type: String,
    required: false,
    default: ''
  },
  exposureSource: {
    type: String,
    required: false,
    default: ''
  },
  exposureCategory: {
    type: String,
    required: false,
    default: 'I'
  },

  // ===== SITE OF BITE (Individual fields as used in your system) =====
  headBite: {
    type: Boolean,
    default: false
  },
  faceBite: {
    type: Boolean,
    default: false
  },
  neckBite: {
    type: Boolean,
    default: false
  },
  chestBite: {
    type: Boolean,
    default: false
  },
  backBite: {
    type: Boolean,
    default: false
  },
  abdomenBite: {
    type: Boolean,
    default: false
  },
  upperExtremitiesBite: {
    type: Boolean,
    default: false
  },
  lowerExtremitiesBite: {
    type: Boolean,
    default: false
  },
  othersBite: {
    type: Boolean,
    default: false
  },
  othersBiteSpecify: {
    type: String,
    required: false,
    default: ''
  },

  // ===== NATURE OF INJURY (Individual fields as used in your system) =====
  multipleInjuries: {
    type: Boolean,
    default: false
  },
  abrasion: {
    type: Boolean,
    default: false
  },
  avulsion: {
    type: Boolean,
    default: false
  },
  burn: {
    type: Boolean,
    default: false
  },
  burnDegree: {
    type: Number,
    required: false,
    default: 1
  },
  burnSite: {
    type: String,
    required: false,
    default: ''
  },
  concussion: {
    type: Boolean,
    default: false
  },
  contusion: {
    type: Boolean,
    default: false
  },
  openWound: {
    type: Boolean,
    default: false
  },
  trauma: {
    type: Boolean,
    default: false
  },
  othersInjury: {
    type: Boolean,
    default: false
  },
  othersInjuryDetails: {
    type: String,
    required: false,
    default: ''
  },

  // ===== EXTERNAL CAUSE =====
  typeNonBite: {
    type: Boolean,
    default: false
  },
  typeBite: {
    type: Boolean,
    default: false
  },

  // ===== ANIMAL PROFILE =====
  animalStatus: {
    type: String,
    required: false,
    default: ''
  },

  // ===== MANAGEMENT =====
  rig: {
    type: Boolean,
    default: false
  },
  genericName: {
    type: String,
    required: false,
    default: 'PVRV'
  },
  brandName: {
    type: String,
    required: false,
    default: 'SPEEDA'
  },
  route: {
    type: String,
    required: false,
    default: 'ID'
  },
  lastArn: {
    type: String,
    required: false,
    default: ''
  },
  completed: {
    type: String,
    required: false,
    default: ''
  },
  tt: {
    type: String,
    required: false,
    default: ''
  },

  // ===== VACCINATION SCHEDULE =====
  scheduleDates: {
    type: [String],
    required: true
  },
  d0Date: {
    type: String,
    required: false,
    default: ''
  },
  d3Date: {
    type: String,
    required: false,
    default: ''
  },
  d7Date: {
    type: String,
    required: false,
    default: ''
  },
  d14Date: {
    type: String,
    required: false,
    default: ''
  },
  d28Date: {
    type: String,
    required: false,
    default: ''
  },
  d0Status: {
    type: String,
    required: false,
    default: 'scheduled'
  },
  d3Status: {
    type: String,
    required: false,
    default: 'scheduled'
  },
  d7Status: {
    type: String,
    required: false,
    default: 'scheduled'
  },
  d14Status: {
    type: String,
    required: false,
    default: 'scheduled'
  },
  d28Status: {
    type: String,
    required: false,
    default: 'scheduled'
  },

  // ===== PATIENT IMMUNIZATION HISTORY =====
  ttActive: {
    type: Boolean,
    default: false
  },
  ttPassive: {
    type: Boolean,
    default: false
  },
  tt1Date: {
    type: String,
    required: false,
    default: ''
  },
  tt2Date: {
    type: String,
    required: false,
    default: ''
  },
  tt3Date: {
    type: String,
    required: false,
    default: ''
  },

  // ===== CURRENT IMMUNIZATION =====
  currentActive: {
    type: Boolean,
    default: false
  },
  currentPostExposure: {
    type: Boolean,
    default: false
  },
  currentPreExposure: {
    type: Boolean,
    default: false
  },
  currentPreviouslyImmunized: {
    type: Boolean,
    default: false
  },
  currentPvrv: {
    type: Boolean,
    default: false
  },
  currentPcec: {
    type: Boolean,
    default: false
  },
  currentId: {
    type: Boolean,
    default: false
  },
  currentIm: {
    type: Boolean,
    default: false
  },
  currentPassive: {
    type: Boolean,
    default: false
  },
  currentSkinTest: {
    type: Boolean,
    default: false
  },
  currentSkinTestTime: {
    type: String,
    required: false,
    default: ''
  },
  currentSkinTestReadTime: {
    type: String,
    required: false,
    default: ''
  },
  currentSkinTestResult: {
    type: String,
    required: false,
    default: ''
  },
  currentSkinTestDate: {
    type: String,
    required: false,
    default: ''
  },
  currentHrig: {
    type: Boolean,
    default: false
  },
  hrigDose: {
    type: String,
    required: false,
    default: ''
  },
  hrigDate: {
    type: String,
    required: false,
    default: ''
  },
  currentLocalInfiltration: {
    type: Boolean,
    default: false
  },
  currentStructured: {
    type: Boolean,
    default: false
  },
  currentUnstructured: {
    type: Boolean,
    default: false
  },

  // ===== CASE STATUS =====
  status: {
    type: String,
    default: 'in_progress'
  },
  remarks: {
    type: String,
    required: false,
    default: ''
  },
  branchNo: {
    type: String,
    required: false,
    default: ''
  },

  // ===== ASSESSMENT TRACKING =====
  initiallyAssessedBy: {
    type: String,
    required: false,
    default: ''
  },
  finalAssessedBy: {
    type: String,
    required: false,
    default: ''
  }
}, {
  timestamps: true
});

// Other schemas
const patientSchema = new mongoose.Schema({
  patientId: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  middleName: { type: String, default: '' },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  age: { type: String, required: true },
  sex: { type: String, required: true },
  address: { type: String, required: true },
  center: { type: String, required: true },
  password: { type: String, required: true }
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  center: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const vaccinationDateSchema = new mongoose.Schema({
  biteCaseId: { type: String, required: true },
  patientId: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  d0Date: { type: String, default: '' },
  d3Date: { type: String, default: '' },
  d7Date: { type: String, default: '' },
  d14Date: { type: String, default: '' },
  d28Date: { type: String, default: '' },
  d0Status: { type: String, default: 'scheduled' },
  d3Status: { type: String, default: 'scheduled' },
  d7Status: { type: String, default: 'scheduled' },
  d14Status: { type: String, default: 'scheduled' },
  d28Status: { type: String, default: 'scheduled' },
  treatmentStatus: { type: String, default: 'in_progress' },
  exposureCategory: { type: String, default: 'I' },
  lastTreatmentDate: { type: String, default: '' }
}, { timestamps: true });

const vaccineStockSchema = new mongoose.Schema({
  center: { type: String, required: true },
  centerName: { type: String, required: true },
  branchNo: { type: String, required: true },
  vaccines: [{
    name: { type: String, required: true },
    stockEntries: [{
      stock: { type: Number, required: true },
      expirationDate: { type: String, required: true },
      batchNumber: { type: String, required: true }
    }]
  }]
}, { timestamps: true });

// Models
const BiteCase = mongoose.model('BiteCase', biteCaseSchema);
const Patient = mongoose.model('Patient', patientSchema);
const Admin = mongoose.model('Admin', adminSchema);
const VaccinationDate = mongoose.model('VaccinationDate', vaccinationDateSchema);
const VaccineStock = mongoose.model('VaccineStock', vaccineStockSchema);

// ===== API ROUTES =====

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'BiteAlert API Server', 
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: 'API endpoints are available under /api/'
    }
  });
});

// Auth routes
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Admin.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    res.json({ 
      success: true, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        center: user.center 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Bite cases routes
app.get('/api/bitecases', async (req, res) => {
  try {
    const { patientId } = req.query;
    let query = {};
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    const cases = await BiteCase.find(query).sort({ createdAt: -1 });
    res.json(cases);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bite cases' });
  }
});

app.post('/api/bitecases', async (req, res) => {
  try {
    const biteCase = new BiteCase(req.body);
    await biteCase.save();
    res.status(201).json({ success: true, data: biteCase });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create bite case' });
  }
});

app.put('/api/bitecases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const biteCase = await BiteCase.findByIdAndUpdate(id, updateData, { new: true });
    if (!biteCase) {
      return res.status(404).json({ success: false, message: 'Bite case not found' });
    }
    
    res.json({ success: true, data: biteCase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update bite case' });
  }
});

// Vaccination dates routes
app.get('/api/vaccinationdates', async (req, res) => {
  try {
    const { patientId } = req.query;
    let query = {};
    
    if (patientId) {
      query.patientId = patientId;
    }
    
    const vaccinationDates = await VaccinationDate.find(query).sort({ createdAt: -1 });
    res.json(vaccinationDates);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vaccination dates' });
  }
});

app.post('/api/vaccinationdates', async (req, res) => {
  try {
    const vaccinationDate = new VaccinationDate(req.body);
    await vaccinationDate.save();
    res.status(201).json({ success: true, data: vaccinationDate });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create vaccination date' });
  }
});

app.put('/api/vaccinationdates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const vaccinationDate = await VaccinationDate.findByIdAndUpdate(id, updateData, { new: true });
    if (!vaccinationDate) {
      return res.status(404).json({ success: false, message: 'Vaccination date not found' });
    }
    
    res.json({ success: true, data: vaccinationDate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update vaccination date' });
  }
});

// Reschedule endpoint
app.post('/api/vaccinationdates/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { dayLabel, newDate } = req.body;
    
    if (!dayLabel || !newDate) {
      return res.status(400).json({ success: false, message: 'dayLabel and newDate are required' });
    }
    
    const labels = ['Day 0','Day 3','Day 7','Day 14','Day 28'];
    const addDays = [0,3,7,14,28];
    const dateMap = { 'Day 0': 'd0Date', 'Day 3': 'd3Date', 'Day 7': 'd7Date', 'Day 14': 'd14Date', 'Day 28': 'd28Date' };
    const statusMap = { 'Day 0': 'd0Status', 'Day 3': 'd3Status', 'Day 7': 'd7Status', 'Day 14': 'd14Status', 'Day 28': 'd28Status' };
    
    const idxBase = labels.indexOf(dayLabel);
    if (idxBase < 0) return res.status(400).json({ success: false, message: 'Invalid dayLabel' });
    
    const doc = await VaccinationDate.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    
    const base = new Date(newDate);
    if (isNaN(base.getTime())) return res.status(400).json({ success: false, message: 'Invalid newDate' });
    
    const update = {};
    update[dateMap[dayLabel]] = base;
    if (doc[statusMap[dayLabel]] !== 'completed') update[statusMap[dayLabel]] = 'scheduled';
    
    for (let i = idxBase + 1; i < labels.length; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + (addDays[i] - addDays[idxBase]));
      update[dateMap[labels[i]]] = d;
      if (doc[statusMap[labels[i]]] !== 'completed') update[statusMap[labels[i]]] = 'scheduled';
    }
    
    const result = await VaccinationDate.findByIdAndUpdate(id, { $set: { ...update, updatedAt: new Date() } }, { new: true });
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error rescheduling vaccination:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule vaccination' });
  }
});

// Patients routes
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch patients' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to create patient' });
  }
});

// Vaccine stocks routes
app.get('/api/vaccinestocks', async (req, res) => {
  try {
    const stocks = await VaccineStock.find();
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch vaccine stocks' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});