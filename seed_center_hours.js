const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://lricamara6:Lanz0517@bitealert.febjlgm.mongodb.net/bitealert?retryWrites=true&w=majority";

const centerHoursSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, default: '' },
  address: { type: String, default: '' },
  hours: {
    weekday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  }
}, { collection: 'center_hours' });

const CenterHours = mongoose.model('CenterHours', centerHoursSchema);

const centers = [
  { name: "Addition Hills", location: "", address: "Addition Hills, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Balong-Bato", location: "", address: "Balong-Bato, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Batis", location: "", address: "Batis, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Corazon De Jesus", location: "", address: "Corazon De Jesus, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Ermitaño", location: "", address: "Ermitaño, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Halo-halo", location: "", address: "Halo-halo, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Isabelita", location: "", address: "Isabelita, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Kabayanan", location: "", address: "Kabayanan, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Little Baguio", location: "", address: "Little Baguio, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Maytunas", location: "", address: "Maytunas, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Onse", location: "", address: "Onse, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Pasadeña", location: "", address: "Pasadeña, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Pedro Cruz", location: "", address: "Pedro Cruz, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Progreso", location: "", address: "Progreso, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Rivera", location: "", address: "Rivera, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Salapan", location: "", address: "Salapan, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "San Perfecto", location: "", address: "San Perfecto, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Santa Lucia", location: "", address: "Santa Lucia, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Tibagan", location: "", address: "Tibagan, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "West Crame", location: "", address: "West Crame, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } },
  { name: "Greenhills", location: "", address: "Greenhills, San Juan City", hours: { weekday: { start: "08:00", end: "17:00" }, saturday: { start: "09:00", end: "15:00" }, sunday: { start: "09:00", end: "12:00" } } }
];

async function seed() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await CenterHours.deleteMany({});
  await CenterHours.insertMany(centers);
  console.log('Center hours seeded!');
  mongoose.disconnect();
}

seed(); 