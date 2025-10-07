const mongoose = require('mongoose');

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

module.exports = mongoose.model('BiteCase', biteCaseSchema);