const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
// Use PORT for Render deployment, fallback to API_PORT for local development
const PORT = process.env.PORT || process.env.API_PORT || 4000;

// Middleware Setup
app.use(express.json());

// CORS configuration to allow frontend origin and credentials
const allowedOrigins = [
    process.env.FRONTEND_ORIGIN,
    'http://localhost:3000',
    'http://localhost:3002',
    'https://bitealert-frontend.onrender.com',
    'https://bitealert-frontend-ppj8.onrender.com'
].filter(Boolean);

const corsOptions = {
    origin: function(origin, callback) {
        if (!origin) return callback(null, true); // allow same-origin or non-browser clients
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('CORS not allowed for origin: ' + origin), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Remove static file serving - frontend will be served separately

// Initialize Gemini client (server-side only)
let genAI = null;
try {
    // If key missing, try loading .env from project root (one level up)
    if (!process.env.GOOGLE_API_KEY) {
        const rootEnvPath = path.join(__dirname, '..', '.env');
        require('dotenv').config({ path: rootEnvPath });
    }
    // Support alternative env var names; trim quotes/spaces
    let apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLEAI_API_KEY;
    if (apiKey) {
        apiKey = apiKey.replace(/^['\"]|['\"]$/g, '').trim();
    }
    if (apiKey) {
        genAI = new GoogleGenerativeAI(apiKey);
    } else {
        console.warn('GOOGLE_API_KEY not set; /api/prescriptions will fallback to local rules');
    }
} catch (e) {
    console.warn('Failed to initialize GoogleGenerativeAI:', e.message);
}

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://lricamara6:Lanz0517@bitealert.febjlgm.mongodb.net/bitealert?retryWrites=true&w=majority";
const MONGODB_OPTIONS = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    family: 4,
    maxPoolSize: 10
};

// Schema Definitions
const adminSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    birthdate: { type: Date, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin'], required: true },
    adminID: { type: String, unique: true }, // e.g., AD001
    centerName: { type: String, required: true }, // Center assignment for role-based access
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now },
    resetOTP: String,
    resetOTPExpires: Date
});

const superAdminSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    birthdate: { type: Date, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'superadmin' },
    superAdminID: { type: String, unique: true }, // e.g., SA001
    createdAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    resetOTP: String,
    resetOTPExpires: Date
});

const auditLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    role: { type: String, required: true },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    action: { type: String, required: true },
    adminID: String,
    superAdminID: String,
    patientID: String,
    staffID: String
});

const animalBiteSchema = new mongoose.Schema({
    patientName: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    barangay: { type: String, required: true },
    incidentDate: { type: Date, required: true },
    animalType: { type: String, required: true },
    vaccinationStatus: { type: String, required: true },
    woundLocation: { type: String, required: true },
    severity: { type: String, required: true },
    treatmentGiven: { type: String, required: true },
    followUpDate: { type: Date },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Staff Schema and Model
const staffSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    phone: String,
    birthdate: Date,
    password: String,
    role: String,
    createdAt: Date,
    isApproved: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false }
});
const Staff = mongoose.model('Staff', staffSchema, 'staffs');

const Admin = mongoose.model('Admin', adminSchema);
const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);
const AuditTrail = mongoose.model('AuditTrail', auditLogSchema, 'audittrail');
const AnimalBite = mongoose.model('AnimalBite', animalBiteSchema);

// Inventory Item Schema and Model
const inventoryItemSchema = new mongoose.Schema({
    barangay: { type: String, required: true },
    type: { type: String, enum: ['Vaccine', 'Medicine', 'Other'], required: true },
    name: { type: String, required: true },
    batchNumber: { type: String },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true },
    minThreshold: { type: Number, required: true, default: 0 },
    expiryDate: { type: Date },
    lastUpdated: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    notes: { type: String },
    status: { type: String, enum: ['active', 'expired', 'low', 'out'], default: 'active' }
});
const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

// Stock History Schema and Model
const stockHistorySchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    change: { type: Number, required: true },
    oldValue: { type: Number, required: true },
    newValue: { type: Number, required: true },
    adminId: { type: String, required: true },
    adminName: { type: String },
    timestamp: { type: Date, default: Date.now },
    reason: { type: String }
});
const StockHistory = mongoose.model('StockHistory', stockHistorySchema);

// Default SuperAdmin Accounts
const DEFAULT_SUPERADMINS = [
    {
        id: "681a4d793a6a72d951d31394",
        firstName: "Lanz Ashlee",
        middleName: "D.",
        lastName: "Ricamara",
        email: "admin@bitealert.com",
        phoneNumber: "09123456789",
        birthdate: new Date("1990-01-01"),
        password: "Admin123!",
        role: "superadmin",
        superAdminID: "SA001"
    },
    {
        id: "681a4d793a6a72d951d31395",
        firstName: "Bite",
        middleName: "",
        lastName: "Alert",
        email: "bitealert1@gmail.com",
        phoneNumber: "09123456788",
        birthdate: new Date("1991-01-01"),
        password: "Admin123!",
        role: "superadmin",
        superAdminID: "SA002"
    },
    {
        id: "681a4d793a6a72d951d31396",
        firstName: "Juan",
        middleName: "",
        lastName: "Dela Cruz",
        email: "admin3@bitealert.com",
        phoneNumber: "09123456787",
        birthdate: new Date("1992-01-01"),
        password: "Admin123!",
        role: "superadmin",
        superAdminID: "SA003"
    }
];

// Initialize SuperAdmin Accounts
async function createInitialSuperAdmins() {
    for (const superAdminData of DEFAULT_SUPERADMINS) {
        try {
            const existingUser = await SuperAdmin.findOne({ email: superAdminData.email });
            if (existingUser) {
                // Update existing superadmin's password
                const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
                existingUser.password = hashedPassword;
                existingUser.superAdminID = superAdminData.superAdminID;
                await existingUser.save();
                console.log(`Existing SuperAdmin account (${superAdminData.email}) password updated successfully`);
            } else {
                // Create new superadmin
                const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
                const superAdmin = new SuperAdmin({
                    firstName: superAdminData.firstName,
                    middleName: superAdminData.middleName,
                    lastName: superAdminData.lastName,
                    email: superAdminData.email,
                    phoneNumber: superAdminData.phoneNumber,
                    birthdate: superAdminData.birthdate,
                    password: hashedPassword,
                    role: superAdminData.role,
                    superAdminID: superAdminData.superAdminID
                });
                await superAdmin.save();
                console.log(`New SuperAdmin account (${superAdminData.email}) created successfully`);
            }
        } catch (error) {
            console.error(`Error managing SuperAdmin account (${superAdminData.email}):`, error);
        }
    }
}

// Patch all superadmins and admins to ensure they have superAdminID and adminID
async function patchAdminAndSuperAdminIDs() {
    // Patch SuperAdmins
    const superAdmins = await SuperAdmin.find({});
    let superAdminCounter = 1;
    for (const sa of superAdmins) {
        if (!sa.superAdminID) {
            sa.superAdminID = `SA${String(superAdminCounter).padStart(3, '0')}`;
            await sa.save();
        }
        superAdminCounter++;
    }
    // Patch Admins
    const admins = await Admin.find({});
    let adminCounter = 1;
    for (const admin of admins) {
        if (!admin.adminID) {
            admin.adminID = `AD${String(adminCounter).padStart(3, '0')}`;
            await admin.save();
        }
        adminCounter++;
    }
}

// Function to log audit trail
async function logAuditTrail(role, firstName, middleName, lastName, action, ids = {}) {
    try {
        const auditLog = new AuditTrail({
            timestamp: new Date(),
            role,
            firstName,
            middleName,
            lastName,
            action,
            adminID: ids.adminID || null,
            superAdminID: ids.superAdminID || null,
            patientID: ids.patientID || null,
            staffID: ids.staffID || null
        });
        await auditLog.save();
    } catch (error) {
        console.error('Error logging audit trail:', error);
    }
}

// Add WebSocket and HTTP server setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connections store
const clients = new Set();

// WebSocket connection handling
wss.on('connection', (ws) => {
    clients.add(ws);

    ws.on('close', () => {
        clients.delete(ws);
    });
});

// Broadcast updates to all connected clients
function broadcastUpdate(data) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Root route - API information
app.get('/', (req, res) => {
    res.json({
        message: 'BiteAlert API Server',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            docs: 'API endpoints are available under /api/'
        }
    });
});

// API Routes
// Create Account
app.post('/api/create-account', async (req, res) => {
    try {
        const { firstName, middleName, lastName, email, phoneNumber, birthdate, password, role, centerName } = req.body;

        console.log('Received create account request:', req.body); // Debug log

        // Validate required fields
        if (!firstName || !lastName || !email || !phoneNumber || !birthdate || !password || !role) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be filled out',
                errors: {
                    firstName: !firstName ? 'First name is required' : undefined,
                    lastName: !lastName ? 'Last name is required' : undefined,
                    email: !email ? 'Email is required' : undefined,
                    phoneNumber: !phoneNumber ? 'Phone number is required' : undefined,
                    birthdate: !birthdate ? 'Birthdate is required' : undefined,
                    password: !password ? 'Password is required' : undefined,
                    role: !role ? 'Role is required' : undefined,
                    centerName: (role === 'admin' && !centerName) ? 'Center assignment is required for admin accounts' : undefined
                }
            });
        }

        // Validate center assignment for admin role
        if (role === 'admin' && !centerName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Center assignment is required for admin accounts',
                errors: {
                    centerName: 'Please select a center for this admin account'
                }
            });
        }

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email address',
                errors: {
                    email: 'Please enter a valid email address'
                }
            });
        }

        // Check if email already exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        const existingSuperAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
        
        if (existingAdmin || existingSuperAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'This email address is already registered',
                errors: {
                    email: 'This email address is already registered'
                }
            });
        }

        // Validate phone number format (Philippine format)
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789)',
                errors: {
                    phoneNumber: 'Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789)'
                }
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        let newAccount;
        if (role === 'superadmin') {
            const superAdminID = await getNextSuperAdminID();
            newAccount = new SuperAdmin({
                firstName,
                middleName,
                lastName,
                email: email.toLowerCase(),
                phoneNumber,
                birthdate,
                password: hashedPassword,
                role,
                superAdminID,
                isActive: true,
                createdAt: new Date()
            });
        } else {
            const adminID = await getNextAdminID();
            newAccount = new Admin({
                firstName,
                middleName,
                lastName,
                email: email.toLowerCase(),
                phoneNumber,
                birthdate,
                password: hashedPassword,
                role,
                adminID,
                centerName: centerName, // Add center assignment
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Save the admin to the database
        await newAccount.save();
        console.log('New admin created successfully:', newAccount); // Debug log

        // Log the action
        await logAuditTrail(
            newAccount.role,
            newAccount.firstName,
            newAccount.middleName,
            newAccount.lastName,
            'CREATE_ACCOUNT',
            {
                adminID: newAccount.adminID,
                superAdminID: newAccount.superAdminID
            }
        );

        // Broadcast the update to all connected clients
        broadcastUpdate({
            type: 'newAccount',
            account: {
                id: newAccount._id,
                firstName: newAccount.firstName,
                middleName: newAccount.middleName,
                lastName: newAccount.lastName,
                email: newAccount.email,
                role: newAccount.role,
                adminID: newAccount.adminID,
                superAdminID: newAccount.superAdminID
            }
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Account created successfully',
            user: {
                id: newAccount._id,
                firstName: newAccount.firstName,
                middleName: newAccount.middleName,
                lastName: newAccount.lastName,
                email: newAccount.email,
                role: newAccount.role,
                adminID: newAccount.adminID,
                superAdminID: newAccount.superAdminID
            }
        });
    } catch (error) {
        console.error('Error creating account:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to create account. Please try again.',
            error: error.message
        });
    }
});

// Unified Login Route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt for email: ${email}`);

        // Check SuperAdmin collection first
        let user = await SuperAdmin.findOne({ email });
        let userType = 'superadmin';

        // If not found, check Admin collection
        if (!user) {
            user = await Admin.findOne({ email });
            userType = user ? user.role : null;
        }

        if (!user) {
            console.log(`Login failed: User not found for email ${email}`);
            return res.json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Validate password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            console.log(`Login failed: Invalid password for email ${email}`);
            return res.json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if admin account is active (only for regular admins)
        if (userType === 'admin' && user.isActive === false) {
            console.log(`Login failed: Account is deactivated for ${email}`);
            return res.json({
                success: false,
                message: 'Your account has been deactivated. Please contact a super admin.'
            });
        }

        // Log the action with the correct ID
        const ids = {};
        if (userType === 'admin') {
            ids.adminID = user.adminID;
        } else if (userType === 'superadmin') {
            ids.superAdminID = user.superAdminID;
        }

        await logAuditTrail(
            userType,
            user.firstName,
            user.middleName,
            user.lastName,
            'Signed in',
            ids
        );
        
        console.log(`Login successful for ${email} (${userType})`);

        // Send response
        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                role: userType,
                adminID: user.adminID,
                superAdminID: user.superAdminID,
                centerName: user.centerName || null // Include center information for role-based access
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.json({
            success: false,
            message: 'An error occurred during login. Please try again.'
        });
    }
});

// Alias route to support frontend calling /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt (alias) for email: ${email}`);

        let user = await SuperAdmin.findOne({ email });
        let userType = 'superadmin';

        if (!user) {
            user = await Admin.findOne({ email });
            userType = user ? user.role : null;
        }

        if (!user) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.json({ success: false, message: 'Invalid email or password' });
        }

        if (userType === 'admin' && user.isActive === false) {
            return res.json({ success: false, message: 'Your account has been deactivated. Please contact a super admin.' });
        }

        const ids = {};
        if (userType === 'admin') {
            ids.adminID = user.adminID;
        } else if (userType === 'superadmin') {
            ids.superAdminID = user.superAdminID;
        }

        await logAuditTrail(
            userType,
            user.firstName,
            user.middleName,
            user.lastName,
            'Signed in',
            ids
        );

        return res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                role: userType,
                adminID: user.adminID,
                superAdminID: user.superAdminID,
                centerName: user.centerName || null
            }
        });
    } catch (error) {
        console.error('Login error (alias):', error);
        return res.json({ success: false, message: 'An error occurred during login. Please try again.' });
    }
});

// Get Audit Trail API Endpoint
app.get('/api/audit-trail', async (req, res) => {
    try {
        const { dateFrom, dateTo, role } = req.query;
        let query = {};
        if (dateFrom || dateTo) {
            query.timestamp = {};
            if (dateFrom) query.timestamp.$gte = new Date(dateFrom);
            if (dateTo) query.timestamp.$lte = new Date(dateTo);
        }
        if (role) query.role = new RegExp(role, 'i');
        const auditLogs = await AuditTrail.find(query)
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(auditLogs);
    } catch (error) {
        console.error('Error fetching audit trail:', error);
        res.status(500).json({ message: 'Error fetching audit trail' });
    }
});

// Modify your existing logout endpoint or add one if it doesn't exist
app.post('/api/logout', async (req, res) => {
    try {
        const { role, firstName, middleName, lastName, adminID, superAdminID, action } = req.body;
        
        // Create the appropriate ID object based on role
        const ids = {};
        if (role === 'admin' && adminID) {
            ids.adminID = adminID;
        } else if (role === 'superadmin' && superAdminID) {
            ids.superAdminID = superAdminID;
        }

        // Log the audit trail with the correct ID
        await logAuditTrail(
            role,
            firstName,
            middleName,
            lastName,
            action || 'Signed out',
            ids
        );

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Error during logout' });
    }
});

// Optimize the Get All Admin Accounts endpoint
app.get('/api/admin-accounts', async (req, res) => {
    try {
        const { center } = req.query;
        
        // Build filter for center-based access
        let adminFilter = { role: 'admin' };
        if (center) {
            adminFilter.centerName = { $regex: center, $options: 'i' };
        }
        
        const [adminUsers, superAdmins] = await Promise.all([
            Admin.find(adminFilter)
                .select('_id firstName middleName lastName email createdAt isActive adminID centerName')
                .lean(),
            SuperAdmin.find()
                .select('_id firstName middleName lastName email createdAt superAdminID')
                .lean()
        ]);
        
        const allAccounts = [
            ...superAdmins.map(admin => ({
                id: admin._id,
                username: admin.email,
                firstName: admin.firstName,
                middleName: admin.middleName,
                lastName: admin.lastName,
                role: 'superadmin',
                createdAt: admin.createdAt,
                isActive: true,
                superAdminID: admin.superAdminID
            })),
            ...adminUsers.map(admin => ({
                id: admin._id,
                username: admin.email,
                firstName: admin.firstName,
                middleName: admin.middleName,
                lastName: admin.lastName,
                role: 'admin',
                createdAt: admin.createdAt,
                isActive: admin.isActive,
                adminID: admin.adminID,
                centerName: admin.centerName
            }))
        ];

        // Cache the results in Redis or memory cache if available
        res.json(allAccounts);
    } catch (error) {
        console.error('Error fetching admin accounts:', error);
        res.status(500).json({ message: 'Error fetching admin accounts' });
    }
});

// Optimize the Update Account Status endpoint
app.post('/api/update-account-status', async (req, res) => {
    try {
        const { accountId, isActive } = req.body;
        const isActiveBoolean = Boolean(isActive);
        
        const user = await Admin.findByIdAndUpdate(
            accountId,
            { 
                $set: { isActive: isActiveBoolean },
                $currentDate: { updatedAt: true }
            },
            { 
                new: true,
                select: '_id firstName middleName lastName email role isActive'
            }
        );

        if (!user) {
            const superAdmin = await SuperAdmin.findById(accountId);
            if (superAdmin) {
                return res.status(400).json({ 
                    success: false,
                    message: 'SuperAdmin accounts cannot be deactivated' 
                });
            }
            return res.status(404).json({ 
                success: false,
                message: 'Account not found' 
            });
        }

        // Log the action in the background
        logAuditTrail(
            user.role,
            user.firstName,
            user.middleName,
            user.lastName,
            `Account ${isActiveBoolean ? 'activated' : 'deactivated'}`,
            {
                adminID: user.adminID,
                superAdminID: user.superAdminID
            }
        ).catch(error => console.error('Error logging audit trail:', error));

        // Broadcast the update to all connected clients
        broadcastUpdate({
            type: 'accountUpdate',
            account: {
                id: user._id,
                username: user.email,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                role: user.role,
                adminID: user.adminID,
                superAdminID: user.superAdminID
            }
        });
        
        res.json({ 
            success: true,
            message: 'Account status updated successfully',
            account: {
                id: user._id,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                adminID: user.adminID,
                superAdminID: user.superAdminID
            }
        });
    } catch (error) {
        console.error('Error updating account status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating account status', 
            error: error.message 
        });
    }
});

// Get Account Status API Endpoint - to check current account status
app.get('/api/account-status/:email', async (req, res) => {
    try {
        const { email } = req.params;
        console.log(`Checking account status for email: ${email}`);
        
        // First check in Admin collection
        let user = await Admin.findOne({ email });
        let account = null;
        
        if (user) {
            account = {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                role: user.role,
                adminID: user.adminID,
                superAdminID: user.superAdminID,
                centerName: user.centerName || null, // Include center information for role-based access
                isActive: user.isActive
            };
        } else {
            // If not found, check SuperAdmin collection
            const superAdmin = await SuperAdmin.findOne({ email });
            if (superAdmin) {
                account = {
                    id: superAdmin._id,
                    email: superAdmin.email,
                    firstName: superAdmin.firstName,
                    middleName: superAdmin.middleName,
                    lastName: superAdmin.lastName,
                    role: 'superadmin',
                    superAdminID: superAdmin.superAdminID,
                    centerName: null, // SuperAdmins don't have center restrictions
                    isActive: true, // SuperAdmins are always active
                };
            }
        }
        
        if (account) {
            res.json({ success: true, account });
        } else {
            res.status(404).json({ success: false, message: 'Account not found' });
        }
    } catch (error) {
        console.error('Error checking account status:', error);
        res.status(500).json({ success: false, message: 'Error checking account status', error: error.message });
    }
});

// MongoDB Status Check Endpoint
app.get('/api/mongo-status', async (req, res) => {
    try {
        // Check if MongoDB is connected
        const state = mongoose.connection.readyState;
        /*
         * 0 = disconnected
         * 1 = connected
         * 2 = connecting
         * 3 = disconnecting
         */
        
        if (state === 1) {
            res.json({ connected: true, state: 'connected' });
        } else if (state === 2) {
            res.json({ connected: false, state: 'connecting', error: 'Database is still connecting' });
        } else if (state === 3) {
            res.json({ connected: false, state: 'disconnecting', error: 'Database is disconnecting' });
        } else {
            res.json({ connected: false, state: 'disconnected', error: 'Database is not connected' });
        }
    } catch (error) {
        console.error('Error checking MongoDB status:', error);
        res.json({ connected: false, error: error.message });
    }
});

// Analytics API Endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        const days = parseInt(req.query.days || 30);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch cases from bitecases collection
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const cases = await BiteCase.find({
            createdAt: { $gte: startDate }
        }).lean();

        // Initialize analysis
        const analysis = {
            totalCases: cases.length,
            casesByBarangay: {},
            casesByStatus: {
                pending: 0,
                'in-progress': 0,
                resolved: 0
            },
            casesBySeverity: {
                low: 0,
                medium: 0,
                high: 0
            }
        };

        // Process cases
        cases.forEach(case_ => {
            // Count by barangay
            const barangay = case_.barangay || case_.address || 'Unknown';
            analysis.casesByBarangay[barangay] = (analysis.casesByBarangay[barangay] || 0) + 1;
            
            // Count by status
            const status = case_.status || 'pending';
            if (status in analysis.casesByStatus) {
                analysis.casesByStatus[status]++;
            }
            
            // Count by severity
            const severity = case_.exposureCategory === 'I' ? 'low' : 
                           case_.exposureCategory === 'II' ? 'medium' : 
                           case_.exposureCategory === 'III' ? 'high' : 'low';
            if (severity in analysis.casesBySeverity) {
                analysis.casesBySeverity[severity]++;
            }
        });

        res.json(analysis);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

// Report API Endpoints
app.get('/api/reports/cases', async (req, res) => {
    try {
        const { startDate, endDate, status } = req.query;
        let query = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const cases = await BiteCase.find(query).sort({ createdAt: -1 });

        const response = {
            totalCases: cases.length,
            pendingCases: cases.filter(c => c.status === 'pending').length,
            resolvedCases: cases.filter(c => c.status === 'resolved').length,
            cases: cases.map(c => ({
                patientName: c.patientName || `${c.lastName || ''}, ${c.firstName || ''}${c.middleName ? ' ' + c.middleName : ''}`.trim(),
                age: c.age || '',
                barangay: c.barangay || c.address || 'Unknown',
                status: c.status || 'pending',
                severity: c.exposureCategory === 'I' ? 'Mild' : 
                         c.exposureCategory === 'II' ? 'Moderate' : 
                         c.exposureCategory === 'III' ? 'Severe' : 'Unknown',
                incidentDate: c.exposureDate || c.createdAt
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Error generating cases report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

app.get('/api/reports/staff', async (req, res) => {
    try {
        const { startDate, endDate, role } = req.query;
        
        // Get staff members
        let staffQuery = {};
        if (role && role !== 'all') {
            staffQuery.role = role;
        }

        const admins = await Admin.find(staffQuery);
        const superAdmins = role === 'admin' ? [] : await SuperAdmin.find();
        const allStaff = [...admins, ...superAdmins];

        // Get activities
        let activityQuery = {
            timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (role && role !== 'all') {
            activityQuery.role = role;
        }

        const activities = await AuditTrail.find(activityQuery).sort({ timestamp: -1 });

        const response = {
            totalStaff: allStaff.length,
            activeStaff: admins.filter(a => a.isActive).length + superAdmins.length,
            activities: activities.map(a => ({
                firstName: a.firstName,
                middleName: a.middleName,
                lastName: a.lastName,
                role: a.role,
                action: a.action,
                timestamp: a.timestamp
            }))
        };

        res.json(response);
    } catch (error) {
        console.error('Error generating staff report:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
});

// Profile API Endpoints
app.get('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let user = await Admin.findById(userId);
        
        if (!user) {
            user = await SuperAdmin.findById(userId);
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            firstName: user.firstName,
            middleName: user.middleName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            birthdate: user.birthdate,
            role: user.role,
            adminID: user.adminID,
            superAdminID: user.superAdminID
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Error fetching profile' });
    }
});

app.put('/api/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, middleName, lastName, email, phoneNumber, birthdate } = req.body;

        // Check if email is already in use by another user
        const existingUser = await Admin.findOne({ email, _id: { $ne: userId } });
        const existingSuperAdmin = await SuperAdmin.findOne({ email, _id: { $ne: userId } });

        if (existingUser || existingSuperAdmin) {
            return res.status(400).json({ message: 'Email is already in use' });
        }

        let user = await Admin.findById(userId);
        let isSuperAdmin = false;

        if (!user) {
            user = await SuperAdmin.findById(userId);
            isSuperAdmin = true;
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields
        user.firstName = firstName;
        user.middleName = middleName;
        user.lastName = lastName;
        user.email = email;
        user.phoneNumber = phoneNumber;
        user.birthdate = birthdate;

        await user.save();

        // Log the update
        const auditUserId3 = getAuditUserId(user);
        await logAuditTrail(
            isSuperAdmin ? 'superadmin' : 'admin',
            firstName,
            middleName,
            lastName,
            'Updated profile information',
            {
                adminID: user.adminID,
                superAdminID: user.superAdminID
            }
        );

        res.json({
            message: 'Profile updated successfully',
            user: {
                firstName: user.firstName,
                middleName: user.middleName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                adminID: user.adminID,
                superAdminID: user.superAdminID
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

app.put('/api/profile/:userId/password', async (req, res) => {
    try {
        const { userId } = req.params;
        const { currentPassword, newPassword } = req.body;

        let user = await Admin.findById(userId);
        let isSuperAdmin = false;

        if (!user) {
            user = await SuperAdmin.findById(userId);
            isSuperAdmin = true;
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Log the password change
        const auditUserId4 = getAuditUserId(user);
        await logAuditTrail(
            isSuperAdmin ? 'superadmin' : 'admin',
            user.firstName,
            user.middleName,
            user.lastName,
            'Changed password',
            {
                adminID: user.adminID,
                superAdminID: user.superAdminID
            }
        );

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Error updating password' });
    }
});

// Enhanced email validation endpoint
app.post('/api/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }

        // Enhanced email format validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid email format' 
            });
        }

        // Check if email exists in both collections
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        const existingSuperAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() });
        
        res.json({ 
            success: true, 
            available: !existingAdmin && !existingSuperAdmin,
            message: existingAdmin || existingSuperAdmin ? 'Email is already registered' : 'Email is available'
        });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking email availability' 
        });
    }
});

// Enhanced name validation endpoint
app.post('/api/check-name', async (req, res) => {
    try {
        const { firstName, middleName, lastName } = req.body;
        
        if (!firstName || !lastName) {
            return res.status(400).json({ 
                success: false, 
                message: 'First name and last name are required' 
            });
        }

        // Name format validation
        const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
        if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Names must contain only letters, spaces, hyphens, and apostrophes (2-50 characters)' 
            });
        }

        // Check name combination in both collections
        const existingAdmin = await Admin.findOne({ 
            firstName: firstName.toLowerCase(),
            lastName: lastName.toLowerCase()
        });
        const existingSuperAdmin = await SuperAdmin.findOne({ 
            firstName: firstName.toLowerCase(),
            lastName: lastName.toLowerCase()
        });
        
        res.json({ 
            success: true, 
            available: !existingAdmin && !existingSuperAdmin,
            message: existingAdmin || existingSuperAdmin ? 'Name combination is already registered' : 'Name is available'
        });
    } catch (error) {
        console.error('Error checking name:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking name availability' 
        });
    }
});

// Enhanced phone validation endpoint
app.post('/api/check-phone', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number is required' 
            });
        }

        // Enhanced phone number format validation (Philippine format)
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid Philippine phone number (e.g., 09123456789 or +639123456789)' 
            });
        }

        // Check phone number in both collections
        const existingAdmin = await Admin.findOne({ phoneNumber });
        const existingSuperAdmin = await SuperAdmin.findOne({ phoneNumber });
        
        res.json({ 
            success: true, 
            available: !existingAdmin && !existingSuperAdmin,
            message: existingAdmin || existingSuperAdmin ? 'Phone number is already registered' : 'Phone number is available'
        });
    } catch (error) {
        console.error('Error checking phone number:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking phone number availability' 
        });
    }
});

// Get Geographical Distribution Data
app.get('/api/get-geographical-data', async (req, res) => {
    try {
        const sanJuanBarangays = [
            'Addition Hills',
            'Balong-Bato',
            'Batisan',
            'Corazon de Jesus',
            'Ermitaño',
            'Greenhills',
            'Halo-Halo',
            'Isabelita',
            'Kabayanan',
            'Little Baguio',
            'Maytunas',
            'Onse',
            'Pasadeña',
            'Pedro Cruz',
            'Progreso',
            'Rivera',
            'Salapan',
            'San Perfecto',
            'Santa Lucia',
            'Tibagan',
            'West Crame'
        ];

        // Get all cases from MongoDB
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const cases = await BiteCase.find({});
        
        // Initialize counts for each barangay
        const barangayCounts = {};
        sanJuanBarangays.forEach(barangay => {
            barangayCounts[barangay] = 0;
        });

        // Count cases for each barangay
        cases.forEach(case_ => {
            // Check both barangay and address fields for matches
            const address = case_.address || '';
            const barangay = case_.barangay || '';
            
            // Find matching barangay from the list
            const matchingBarangay = sanJuanBarangays.find(b => 
                address.toLowerCase().includes(b.toLowerCase()) || 
                barangay.toLowerCase().includes(b.toLowerCase())
            );

            if (matchingBarangay) {
                barangayCounts[matchingBarangay]++;
            }
        });

        // Format response
        const response = {
            locations: sanJuanBarangays,
            cases: sanJuanBarangays.map(barangay => barangayCounts[barangay])
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching geographical data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch geographical data'
        });
    }
});

// Add this before the server startup code
app.get('/api/status', (req, res) => {
    res.json({
        server: 'running',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date()
    });
});

// Test MongoDB connection endpoint
app.get('/api/test-mongo', async (req, res) => {
    try {
        // Try to fetch a single document from each collection
        const [patient, biteCase, inventory, center] = await Promise.all([
            mongoose.connection.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients').findOne(),
            mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases').findOne(),
            mongoose.connection.model('InventoryItem', new mongoose.Schema({}, { strict: false }), 'inventoryitems').findOne(),
            mongoose.connection.model('Center', new mongoose.Schema({}, { strict: false }), 'centers').findOne()
        ]);

        res.json({
            success: true,
            message: 'MongoDB connection test successful',
            collections: {
                patients: patient ? 'has data' : 'empty',
                bitecases: biteCase ? 'has data' : 'empty',
                inventory: inventory ? 'has data' : 'empty',
                centers: center ? 'has data' : 'empty'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'MongoDB connection test failed',
            error: error.message
        });
    }
});

// Fetch demo prescriptive analytics data
app.get('/api/prescriptive-demo', async (req, res) => {
    try {
        const data = await mongoose.connection.collection('prescriptive_analytics_demos').find({}).toArray();

        // Unique prescriptive analytics algorithm
        const weights = {
            caseDensity: 0.3,
            vaccinationCoverage: 0.25,
            strayPopulation: 0.15,
            responseTime: 0.15,
            historicalTrend: 0.15
        };
        const MIN_VACCINE_ALLOCATION = 50; // Minimum vaccines per barangay

        const areas = data.map(area => {
            // Force all fields to numbers and default to 0
            const caseDensity = Number(area.caseDensity) || 0;
            const vaccinationCoverage = Number(area.vaccinationCoverage) || 0;
            const strayPopulation = Number(area.strayPopulation) || 0;
            const responseTime = Number(area.responseTime) || 0;
            const historicalTrend = Number(area.historicalTrend) || 0;

            const riskScore = Math.min(Math.round(
                (caseDensity * weights.caseDensity) +
                ((100 - vaccinationCoverage) * weights.vaccinationCoverage) +
                (strayPopulation * weights.strayPopulation) +
                (responseTime * weights.responseTime) +
                (historicalTrend * weights.historicalTrend)
            ), 100);

            // Debug log
            console.log({
              barangay: area.barangay,
              caseDensity,
              vaccinationCoverage,
              strayPopulation,
              responseTime,
              historicalTrend,
              riskScore
            });

            // Prescriptive recommendations
            let recommendations = [];
            if (riskScore >= 70) {
                recommendations = [
                    'Immediate vaccination drive',
                    'Intensive stray animal control',
                    'Rapid response teams',
                    'Public awareness campaign'
                ];
            } else if (riskScore >= 40) {
                recommendations = [
                    'Schedule vaccination drive',
                    'Regular stray animal monitoring',
                    'Community education'
                ];
            } else {
                recommendations = [
                    'Maintain current programs',
                    'Monitor trends'
                ];
            }

            // Prescriptive vaccine allocation
            // Base: 5% of population
            // + 0.1% of population per riskScore point
            // + 10% more if vaccinationCoverage < 30%
            let base = area.population * 0.05;
            let riskBoost = area.population * (riskScore / 1000); // 0.1% per risk point
            let lowCoverageBoost = area.vaccinationCoverage < 30 ? base * 0.1 : 0;
            let allocation = Math.round(base + riskBoost + lowCoverageBoost);
            allocation = Math.max(allocation, MIN_VACCINE_ALLOCATION);

            return {
                ...area,
                name: area.barangay,
                caseTrend: area.historicalTrend,
                riskScore,
                recommendations,
                resources: {
                    vaccines: allocation,
                    personnel: Math.ceil(area.population / 1000 * (riskScore / 100 + 1)),
                    awarenessMaterials: Math.ceil(area.population / 500 * (riskScore / 100 + 1))
                }
            };
        });

        res.json({ success: true, areas });
    } catch (error) {
        console.error('Error fetching demo data:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Helper: Weighted Moving Average
function weightedMovingAverage(data, weights) {
    let sum = 0, weightSum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * (weights[i] || 1);
        weightSum += (weights[i] || 1);
    }
    return weightSum ? sum / weightSum : 0;
}

// Helper: Dummy Distance (replace with real logic if needed)
function getDistance(center, barangay) {
    return Math.random() * 10 + 1;
}

// Enhanced AI Prescriptions endpoint with comprehensive data analysis
app.post('/api/prescriptions', async (req, res) => {
    try {
        const { riskAnalysis, timeRange, selectedBarangay } = req.body || {};
        if (!riskAnalysis || typeof riskAnalysis !== 'object') {
            return res.status(400).json({ error: 'riskAnalysis object required' });
        }

        // Get comprehensive bite case data for AI analysis
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const now = new Date();
        const timeRangeMap = { week: 7, month: 30, quarter: 90, year: 365 };
        const daysBack = timeRangeMap[timeRange] || 30;
        const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

        // Fetch all cases for the time period
        const allCases = await BiteCase.find({
            createdAt: { $gte: startDate }
        });

        // Analyze case patterns by age groups, time patterns, and severity
        const caseAnalysis = analyzeCasePatterns(allCases, selectedBarangay);
        
        const barangaySummaries = Object.entries(riskAnalysis).map(([barangay, d]) => ({
            barangay,
            totalCases: d.totalCases || 0,
            recentCases: d.recentCases || 0,
            severeCases: d.severeCases || 0,
            riskScore: d.riskScore || 0,
            priority: d.priority || 'low',
            factors: d.factors || [],
            topCenter: d.topCenter || null,
            // Add comprehensive analysis data
            ageDistribution: caseAnalysis[barangay]?.ageDistribution || {},
            timePatterns: caseAnalysis[barangay]?.timePatterns || {},
            severityBreakdown: caseAnalysis[barangay]?.severityBreakdown || {},
            trendAnalysis: caseAnalysis[barangay]?.trendAnalysis || {}
        }));

        if (!genAI) {
            return res.json({ interventions: [] });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const systemInstruction = `You are an expert public health decision-support assistant specializing in animal bite incident prevention and control in San Juan City barangays. 

        You will receive comprehensive data including case counts, age distributions, time patterns, severity breakdowns, and trend analysis for each barangay. Your task is to generate evidence-based, actionable interventions.

        ANALYSIS REQUIREMENTS:
        - Analyze case spikes and patterns based on age groups, time periods, and severity
        - Identify high-risk demographics and temporal patterns
        - Assess resource allocation needs based on case volume and severity
        - Consider coordination with health centers and emergency response

        RESPONSE FORMAT:
        Return ONLY a JSON array with this exact structure:
        [{
          "barangay": "string",
          "priority": "high|medium|low", 
          "riskScore": number,
          "reasoning": "Detailed analysis of case patterns, spikes, and risk factors",
          "recommendations": "Specific, actionable steps for barangay officials",
          "ageGroupFocus": "Primary age group requiring attention",
          "timePattern": "Identified temporal pattern (daily/weekly/monthly spikes)",
          "resourceNeeds": "Required resources and personnel",
          "coordinationRequired": "Health center coordination needs"
        }]

        PRIORITY GUIDELINES:
        - HIGH: >15 cases OR >5 severe cases OR significant age/time spikes
        - MEDIUM: 5-15 cases OR 2-5 severe cases OR moderate patterns
        - LOW: <5 cases OR minimal patterns

        Focus on immediate, implementable actions that barangay officials can execute within 24-48 hours.`;
        
        const userInstruction = `Time Range: ${timeRange || 'month'}
Selected Barangay: ${selectedBarangay || 'all'}
Comprehensive Barangay Data:
${JSON.stringify(barangaySummaries, null, 2)}

Case Pattern Analysis:
${JSON.stringify(caseAnalysis, null, 2)}`;

        const result = await model.generateContent(`${systemInstruction}\n\n${userInstruction}`);

        let text = result.response.text();
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (jsonMatch) text = jsonMatch[1];

        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            const arrayMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
            json = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
        }

        const interventions = (Array.isArray(json) ? json : []).map(it => ({
            barangay: it.barangay,
            riskScore: Number(it.riskScore) || 0,
            priority: it.priority || 'low',
            reasoning: it.reasoning || '',
            intervention: it.recommendations || '',
            ageGroupFocus: it.ageGroupFocus || '',
            timePattern: it.timePattern || '',
            resourceNeeds: it.resourceNeeds || '',
            coordinationRequired: it.coordinationRequired || '',
            totalCases: barangaySummaries.find(b => b.barangay === it.barangay)?.totalCases || 0,
            recentCases: barangaySummaries.find(b => b.barangay === it.barangay)?.recentCases || 0,
            severeCases: barangaySummaries.find(b => b.barangay === it.barangay)?.severeCases || 0
        })).sort((a, b) => b.riskScore - a.riskScore);

        return res.json({ interventions });
    } catch (err) {
        console.error('Gemini /api/prescriptions error:', err);
        return res.status(500).json({ error: 'Failed to generate prescriptions' });
    }
});

// Helper function to analyze case patterns
function analyzeCasePatterns(cases, selectedBarangay) {
    const analysis = {};
    
    // Filter cases by selected barangay if specified
    const filteredCases = selectedBarangay === 'all' 
        ? cases 
        : cases.filter(c => c.barangay === selectedBarangay);

    // Group by barangay
    const casesByBarangay = {};
    filteredCases.forEach(case_ => {
        const barangay = case_.barangay || 'Unknown';
        if (!casesByBarangay[barangay]) {
            casesByBarangay[barangay] = [];
        }
        casesByBarangay[barangay].push(case_);
    });

    // Analyze each barangay
    Object.entries(casesByBarangay).forEach(([barangay, barangayCases]) => {
        // Age distribution analysis
        const ageGroups = { '0-12': 0, '13-18': 0, '19-35': 0, '36-60': 0, '60+': 0 };
        barangayCases.forEach(c => {
            const age = parseInt(c.age) || 0;
            if (age <= 12) ageGroups['0-12']++;
            else if (age <= 18) ageGroups['13-18']++;
            else if (age <= 35) ageGroups['19-35']++;
            else if (age <= 60) ageGroups['36-60']++;
            else ageGroups['60+']++;
        });

        // Time pattern analysis (daily, weekly, monthly)
        const dailyPattern = {};
        const weeklyPattern = { 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0, 'Thursday': 0, 'Friday': 0, 'Saturday': 0, 'Sunday': 0 };
        const monthlyPattern = {};
        
        barangayCases.forEach(c => {
            const date = new Date(c.createdAt || c.incidentDate);
            const day = date.getDate();
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
            const month = date.getMonth() + 1;
            
            dailyPattern[day] = (dailyPattern[day] || 0) + 1;
            weeklyPattern[dayOfWeek]++;
            monthlyPattern[month] = (monthlyPattern[month] || 0) + 1;
        });

        // Severity breakdown
        const severityBreakdown = { low: 0, medium: 0, high: 0 };
        barangayCases.forEach(c => {
            const severity = c.severity || c.exposureCategory || 'low';
            if (severity === 'high' || severity === 'III') severityBreakdown.high++;
            else if (severity === 'medium' || severity === 'II') severityBreakdown.medium++;
            else severityBreakdown.low++;
        });

        // Trend analysis (comparing recent vs older cases)
        const now = new Date();
        const recentCases = barangayCases.filter(c => {
            const caseDate = new Date(c.createdAt || c.incidentDate);
            return (now - caseDate) <= (7 * 24 * 60 * 60 * 1000); // Last 7 days
        });
        const olderCases = barangayCases.filter(c => {
            const caseDate = new Date(c.createdAt || c.incidentDate);
            return (now - caseDate) > (7 * 24 * 60 * 60 * 1000); // Older than 7 days
        });

        analysis[barangay] = {
            ageDistribution: ageGroups,
            timePatterns: {
                daily: dailyPattern,
                weekly: weeklyPattern,
                monthly: monthlyPattern
            },
            severityBreakdown,
            trendAnalysis: {
                recentCases: recentCases.length,
                olderCases: olderCases.length,
                trendDirection: recentCases.length > olderCases.length ? 'increasing' : 'decreasing',
                spikeDetected: recentCases.length > (olderCases.length / 2) // Simple spike detection
            }
        };
    });

    return analysis;
}

// API: Generate and Store Vaccine Allocation Recommendations
app.post('/api/generate-vaccine-allocation', async (req, res) => {
    try {
        const { startDate, endDate, granularity = 'monthly', minVaccineLevel = 50, bufferPercent = 15 } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const groupFormat = granularity === 'daily' ? "%Y-%m-%d" : granularity === 'yearly' ? "%Y" : "%Y-%m";
        const cases = await AnimalBite.aggregate([
            { $match: { incidentDate: { $gte: start, $lte: end } } },
            { $group: {
                _id: { barangay: "$barangay", period: { $dateToString: { format: groupFormat, date: "$incidentDate" } } },
                count: { $sum: 1 }
            }}
        ]);
        const barangayData = {};
        cases.forEach(c => {
            if (!barangayData[c._id.barangay]) barangayData[c._id.barangay] = [];
            barangayData[c._id.barangay].push({ period: c._id.period, count: c.count });
        });
        const recommendations = [];
        for (const [barangay, periods] of Object.entries(barangayData)) {
            periods.sort((a, b) => a.period.localeCompare(b.period));
            const counts = periods.map(p => p.count);
            const weights = counts.map((_, i, arr) => i >= arr.length - 3 ? 2 : 1);
            const forecast = Math.ceil(weightedMovingAverage(counts, weights));
            let seasonalFactor = 1;
            const travelDistance = getDistance("MainCenter", barangay);
            let recommended = Math.max(
                Math.ceil(forecast * seasonalFactor * (1 + bufferPercent / 100)),
                minVaccineLevel
            );
            let priorityScore = forecast * 2 + travelDistance;
            let confidence = Math.min(1, counts.length / 6 + 0.5);
            let alertFlags = [];
            if (forecast > Math.max(...counts, 0) * 1.5) alertFlags.push("Unusual spike");
            if (counts.length < 3) alertFlags.push("Data gap");
            recommendations.push({
                barangay,
                recommendedQuantity: recommended,
                priorityRank: 0,
                expectedCoveragePeriod: `${granularity === 'monthly' ? 30 : 7} days`,
                confidenceScore: Math.round(confidence * 100) / 100,
                alertFlags
            });
        }
        recommendations.sort((a, b) => b.recommendedQuantity - a.recommendedQuantity);
        recommendations.forEach((rec, i) => rec.priorityRank = i + 1);
        const allocationDoc = new VaccineAllocation({
            generatedAt: new Date(),
            params: { startDate, endDate, granularity, minVaccineLevel, bufferPercent },
            recommendations
        });
        await allocationDoc.save();
        res.json({ success: true, allocation: allocationDoc });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// API: Get the latest vaccine allocation
app.get('/api/vaccine-allocation/latest', async (req, res) => {
    try {
        const latest = await VaccineAllocation.findOne().sort({ generatedAt: -1 });
        if (!latest) {
            return res.json({ success: false, message: "No allocation found." });
        }
        res.json({ success: true, allocation: latest });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// TEMP: Insert sample AnimalBite data for testing
app.post('/api/insert-sample-animalbites', async (req, res) => {
    try {
        const now = new Date();
        const barangays = [
            'Greenhills', 'Salapan', 'Kabayanan', 'Maytunas', 'West Crame',
            'Addition Hills', 'Balong-Bato', 'Batisan', 'Corazon de Jesus', 'Ermitaño',
            'Isabelita', 'Little Baguio', 'Onse', 'Pasadeña', 'Pedro Cruz',
            'Progreso', 'Rivera', 'San Perfecto', 'Santa Lucia', 'Tibagan'
        ];
        const animalTypes = ['Dog', 'Cat', 'Monkey', 'Bat'];
        const woundLocations = ['Arm', 'Leg', 'Face', 'Hand', 'Foot'];
        const samples = [];
        for (let i = 0; i < 60; i++) {
            samples.push({
                patientName: `Test Patient ${i+1}`,
                age: 5 + (i % 60),
                gender: i % 2 === 0 ? 'Male' : 'Female',
                barangay: barangays[i % barangays.length],
                incidentDate: new Date(now.getTime() - (i * 86400000)), // spread over 60 days
                animalType: animalTypes[i % animalTypes.length],
                vaccinationStatus: i % 4 === 0 ? 'Vaccinated' : 'Unvaccinated',
                woundLocation: woundLocations[i % woundLocations.length],
                severity: ['low', 'medium', 'high'][i % 3],
                treatmentGiven: 'Wound cleaning',
                followUpDate: new Date(now.getTime() + ((i % 10) * 86400000)),
                status: ['pending', 'resolved', 'in-progress'][i % 3],
                createdAt: new Date(now.getTime() - (i * 86400000))
            });
        }
        await AnimalBite.insertMany(samples);
        res.json({ success: true, message: 'Expanded sample AnimalBite data inserted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// API endpoint to fetch all staff
app.get('/api/staffs', async (req, res) => {
    try {
        // Build filter for center-based access
        let filter = {};
        const { center } = req.query;
        if (center) {
            // Staff data uses centerName field, not center
            filter.centerName = center;
        }
        
        const staffs = await Staff.find(filter);
        res.json({ success: true, staffs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Approve staff
app.post('/api/staffs/:id/approve', async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { isApproved: true, isVerified: true },
            { new: true }
        );
        if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
        // Log staff approval
        let firstName = staff.fullName;
        let lastName = '';
        if (staff.fullName && staff.fullName.includes(' ')) {
            const parts = staff.fullName.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }
        const auditUserId5 = getAuditUserId(staff);
        await logAuditTrail(
            staff.role,
            firstName,
            '',
            lastName,
            'Staff approved',
            { staffID: staff.staffID }
        );
        res.json({ success: true, staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reject (delete) staff
app.delete('/api/staffs/:id', async (req, res) => {
    try {
        const staff = await Staff.findByIdAndDelete(req.params.id);
        if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
        // Log staff rejection/deletion
        let firstName = staff.fullName;
        let lastName = '';
        if (staff.fullName && staff.fullName.includes(' ')) {
            const parts = staff.fullName.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }
        const auditUserId6 = getAuditUserId(staff);
        await logAuditTrail(
            staff.role,
            firstName,
            '',
            lastName,
            'Staff rejected/deleted',
            { staffID: staff.staffID }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Deactivate staff
app.post('/api/staffs/:id/deactivate', async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, { isApproved: false }, { new: true });
        if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
        // Log staff deactivation
        let firstName = staff.fullName;
        let lastName = '';
        if (staff.fullName && staff.fullName.includes(' ')) {
            const parts = staff.fullName.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }
        const auditUserId7 = getAuditUserId(staff);
        await logAuditTrail(
            staff.role,
            firstName,
            '',
            lastName,
            'Staff deactivated',
            { staffID: staff.staffID }
        );
        res.json({ success: true, staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Activate staff
app.post('/api/staffs/:id/activate', async (req, res) => {
    try {
        const staff = await Staff.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
        if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
        // Log staff activation
        let firstName = staff.fullName;
        let lastName = '';
        if (staff.fullName && staff.fullName.includes(' ')) {
            const parts = staff.fullName.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        }
        const auditUserId8 = getAuditUserId(staff);
        await logAuditTrail(
            auditUserId8,
            staff.role,
            firstName,
            '',
            lastName,
            'Staff activated',
            { staffID: staff.staffID }
        );
        res.json({ success: true, staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== INVENTORY API ENDPOINTS ==================

// Get all inventory items
app.get('/api/inventoryitems', async (req, res) => {
    try {
        const items = await InventoryItem.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch inventory items' });
    }
});

// Get a single inventory item
app.get('/api/inventoryitems/:id', async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch inventory item' });
    }
});

// Create a new inventory item
app.post('/api/inventoryitems', async (req, res) => {
    try {
        const item = new InventoryItem(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create inventory item', error });
    }
});

// Update an inventory item
app.put('/api/inventoryitems/:id', async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update inventory item', error });
    }
});

// Delete an inventory item
app.delete('/api/inventoryitems/:id', async (req, res) => {
    try {
        const item = await InventoryItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted' });
    } catch (error) {
        res.status(400).json({ message: 'Failed to delete inventory item', error });
    }
});

// Adjust stock (add/remove) and log history
app.post('/api/inventoryitems/:id/adjust', async (req, res) => {
    try {
        const { change, adminId, adminName, reason } = req.body;
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });
        const oldValue = item.quantity;
        const newValue = oldValue + change;
        item.quantity = newValue;
        item.lastUpdated = new Date();
        // Update status
        if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
            item.status = 'expired';
        } else if (newValue <= 0) {
            item.status = 'out';
        } else if (newValue <= item.minThreshold) {
            item.status = 'low';
        } else {
            item.status = 'active';
        }
        await item.save();
        // Log stock history
        const history = new StockHistory({
            itemId: item._id,
            change,
            oldValue,
            newValue,
            adminId,
            adminName,
            reason
        });
        await history.save();
        res.json({ item, history });
    } catch (error) {
        res.status(400).json({ message: 'Failed to adjust stock', error });
    }
});

// Get stock history for an item
app.get('/api/inventoryitems/:id/history', async (req, res) => {
    try {
        const history = await StockHistory.find({ itemId: req.params.id }).sort({ timestamp: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stock history' });
    }
});

// Configure your email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    let user = await Admin.findOne({ email }) || await SuperAdmin.findOne({ email });
    if (!user) return res.json({ success: false, message: 'Email not found.' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    await user.save();

    // Send OTP email
    await transporter.sendMail({
      from: `Bite Alert <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Bite Alert Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #800000;">Bite Alert Password Reset</h2>
          <p>Your OTP for password reset is:</p>
          <h1 style="color: #800000; font-size: 32px; letter-spacing: 5px; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px;">${otp}</h1>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.json({ success: false, message: 'Failed to send OTP.' });
  }
});

// Reset password endpoint
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    let user = await Admin.findOne({ email }) || await SuperAdmin.findOne({ email });
    if (!user) return res.json({ success: false, message: 'Email not found.' });

    if (!user.resetOTP || !user.resetOTPExpires || user.resetOTPExpires < new Date()) {
      return res.json({ success: false, message: 'OTP expired or not found.' });
    }
    if (user.resetOTP !== otp) {
      return res.json({ success: false, message: 'Invalid OTP.' });
    }

    // Update password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOTP = undefined;
    user.resetOTPExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful.' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Failed to reset password.' });
  }
});

// Center Schema for vaccine tracking
const centerSchema = new mongoose.Schema({
  centerName: { type: String, required: true },
  address: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactNumber: { type: String, required: true },
  isArchived: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
  serviceHours: [
    {
      day: { type: String, required: true }, // e.g., 'Monday'
      open: { type: String, required: true }, // e.g., '08:00'
      close: { type: String, required: true } // e.g., '17:00'
    }
  ]
});
const Center = mongoose.model('Center', centerSchema);

// --- MIGRATION SCRIPT: Run ONCE, then comment out ---
async function migrateVaccineData() {
  const centers = await Center.find({});
  for (const center of centers) {
    if (!center.vaccines || center.vaccines.length === 0) {
      // Assume old field is center.vaccinesDistributed
      center.vaccines = [
        { type: 'Anti-Rabies', count: center.vaccinesDistributed || 0 }
        // Add more types if you have them in your old data
      ];
      await center.save();
      console.log(`Migrated center: ${center.centerName}`);
    }
  }
}
// migrateVaccineData(); // Uncomment and run once, then comment out

// API: Get all centers
app.get('/api/centers', async (req, res) => {
  try {
    console.log('Fetching all centers...');
    const centers = await Center.find({}).sort({ lastUpdated: -1 });
    console.log(`Found ${centers.length} centers`);
    res.json({ success: true, data: centers });
  } catch (err) {
    console.error('Error fetching centers:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch centers', error: err.message });
  }
});

// Add a new center
app.post('/api/centers', async (req, res) => {
  try {
    console.log('Adding new center:', req.body);
    const { centerName, address, contactPerson, contactNumber } = req.body;
    
    // Validate required fields
    if (!centerName || !address || !contactPerson || !contactNumber) {
      console.log('Missing required fields');
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Create new center
    const center = new Center({
      centerName,
      address,
      contactPerson,
      contactNumber,
      lastUpdated: new Date()
    });

    // Save to database
    const savedCenter = await center.save();
    console.log('Center saved successfully:', savedCenter);
    
    res.status(201).json({ success: true, data: savedCenter });
  } catch (err) {
    console.error('Error adding center:', err);
    res.status(500).json({ success: false, message: 'Failed to add center', error: err.message });
  }
});

// Update a center
app.put('/api/centers/:id', async (req, res) => {
  try {
    console.log('Updating center:', req.params.id, req.body);
    const { centerName, address, contactPerson, contactNumber } = req.body;
    
    // Validate required fields
    if (!centerName || !address || !contactPerson || !contactNumber) {
      console.log('Missing required fields');
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const center = await Center.findByIdAndUpdate(
      req.params.id,
      { 
        centerName, 
        address, 
        contactPerson, 
        contactNumber,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!center) {
      console.log('Center not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Center not found.' });
    }

    console.log('Center updated successfully:', center);
    res.json({ success: true, data: center });
  } catch (err) {
    console.error('Error updating center:', err);
    res.status(500).json({ success: false, message: 'Failed to update center', error: err.message });
  }
});

// Delete a center
app.delete('/api/centers/:id', async (req, res) => {
  try {
    console.log('Deleting center:', req.params.id);
    const center = await Center.findByIdAndDelete(req.params.id);
    
    if (!center) {
      console.log('Center not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Center not found.' });
    }

    console.log('Center deleted successfully:', center);
    res.json({ success: true, message: 'Center deleted successfully' });
  } catch (err) {
    console.error('Error deleting center:', err);
    res.status(500).json({ success: false, message: 'Failed to delete center', error: err.message });
  }
});

// Add archive/unarchive endpoint
app.put('/api/centers/:id/archive', async (req, res) => {
  try {
    console.log('Updating center archive status:', req.params.id, req.body);
    const { isArchived } = req.body;
    
    if (typeof isArchived !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isArchived must be a boolean value' });
    }

    const center = await Center.findByIdAndUpdate(
      req.params.id,
      { 
        isArchived,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!center) {
      console.log('Center not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Center not found.' });
    }

    console.log('Center archive status updated successfully:', center);
    res.json({ success: true, data: center });
  } catch (err) {
    console.error('Error updating center archive status:', err);
    res.status(500).json({ success: false, message: 'Failed to update center archive status', error: err.message });
  }
});

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(MONGODB_URI, MONGODB_OPTIONS);
        console.log('Connected to MongoDB Atlas');
        
        // Create initial super admin after successful connection
        await createInitialSuperAdmins();
        await patchAdminAndSuperAdminIDs(); // <-- Ensure all IDs are patched on startup
        
        // Start the server only after successful database connection
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT} with WebSocket support`);
            console.log(`API endpoints available at http://localhost:${PORT}/api`);
        });
    } catch (err) {
        console.error('MongoDB connection error:', err);
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

// Add error handlers for the server
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    switch (error.code) {
        case 'EACCES':
            console.error(`Port ${PORT} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`Port ${PORT} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
});

// Start the connection
connectWithRetry();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// API: Get case count per center (AnimalBite + bitecases)
app.get('/api/cases-per-center', async (req, res) => {
  try {
    const centers = await Center.find({});
    // For each center, count cases in both collections
    const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
    const results = await Promise.all(centers.map(async center => {
      // Match by centerName (adjust if you use centerId in AnimalBite/bitecases)
      const animalBiteCount = await AnimalBite.countDocuments({ barangay: center.centerName });
      const biteCaseCount = await BiteCase.countDocuments({ barangay: center.centerName });
      return {
        centerName: center.centerName,
        caseCount: animalBiteCount + biteCaseCount
      };
    }));
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cases per center', error: err.message });
  }
});

// API: Get case count per center (bitecases only, match centerName in address)
app.get('/api/cases-per-center', async (req, res) => {
  try {
    const centers = await Center.find({});
    const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
    const results = await Promise.all(centers.map(async center => {
      // Use a case-insensitive regex to match centerName in address
      const biteCaseCount = await BiteCase.countDocuments({
        address: { $regex: center.centerName, $options: 'i' }
      });
      return {
        centerName: center.centerName,
        caseCount: biteCaseCount
      };
    }));
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cases per center', error: err.message });
  }
});

// API: Dashboard summary counts (patients, inventory, active cases from patients, centers, no date filter)
app.get('/api/dashboard-summary', async (req, res) => {
  try {
    const { center } = req.query;
    
    // Build filters for center-based access
    let patientFilter = {};
    let bitecaseFilter = { status: { $in: ['pending', 'in_progress'] } };
    let staffFilter = {};
    
    if (center) {
      patientFilter.center = center;
      // Filter bite cases by center name in address field (case-insensitive)
      bitecaseFilter.address = { $regex: center, $options: 'i' };
      staffFilter.centerName = center;
    }

    // Total Patients: count from 'patients' collection
    const Patient = mongoose.connection.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
    const totalPatients = await Patient.countDocuments(patientFilter);

    // Vaccine Stocks: sum quantity from 'vaccinestocks' collection (handled separately in frontend)
    const vaccineStocks = 0; // Will be calculated in frontend with center filtering

    // Active Cases: count from 'bitecases' collection where status is 'pending' or 'in_progress'
    const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
    const activeCases = await BiteCase.countDocuments(bitecaseFilter);

    // Health Centers: count from 'centers' collection
    const Center = mongoose.connection.model('Center', new mongoose.Schema({}, { strict: false }), 'centers');
    const healthCenters = center ? 1 : await Center.countDocuments(); // Center-based admins see only 1 center

    // Admins: count from 'admins' collection
    const Admin = mongoose.connection.model('Admin', new mongoose.Schema({}, { strict: false }), 'admins');
    const adminCount = center ? 1 : await Admin.countDocuments(); // Center-based admins see only themselves

    // Staff: count from 'staffs' collection (handled separately in frontend for center filtering)
    const staffCount = 0; // Will be calculated in frontend with center filtering

    res.json({
      success: true,
      data: {
        totalPatients,
        vaccineStocks,
        activeCases,
        healthCenters,
        adminCount,
        staffCount
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary', error: err.message });
  }
});

// API: Get case count per barangay by searching address in bitecases (with date filter)
app.get('/api/cases-per-center', async (req, res) => {
  try {
    const filter = req.query.filter || 'month';
    let dateFrom = new Date();
    switch (filter) {
      case 'today':
        dateFrom.setHours(0,0,0,0);
        break;
      case 'week':
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case 'month':
        dateFrom.setDate(1);
        break;
      case 'year':
        dateFrom = new Date(dateFrom.getFullYear(), 0, 1);
        break;
    }
    const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
    const results = await Promise.all(barangays.map(async barangay => {
      const count = await BiteCase.countDocuments({
        address: { $regex: barangay, $options: 'i' },
        createdAt: { $gte: dateFrom }
      });
      return {
        centerName: barangay,
        caseCount: count
      };
    }));
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cases per center', error: err.message });
  }
});

// List of all barangays in San Juan (add/remove as needed)
const barangays = [
  "Addition Hills", "Balong-Bato", "Batisan", "Corazon de Jesus", "Ermitaño",
  "Greenhills", "Halo-Halo", "Isabelita", "Kabayanan", "Little Baguio",
  "Maytunas", "Onse", "Pasadeña", "Pedro Cruz", "Progreso", "Rivera",
  "Salapan", "San Perfecto", "Santa Lucia", "Tibagan", "West Crame"
];

// Helper function for vaccine stock prescription
function prescribeVaccineStock(caseCount, basePerCase = 2, bufferPercent = 0.2, minStock = 50) {
  const base = caseCount * basePerCase;
  const buffer = Math.ceil(base * bufferPercent);
  return Math.max(minStock, base + buffer);
}

// API: Prescribe and allocate vaccine stocks for each barangay (detailed by severity and vaccine type)
app.get('/api/prescribe-vaccine-distribution', async (req, res) => {
  try {
    const barangays = [
      "Addition Hills", "Balong-Bato", "Batisan", "Corazon de Jesus", "Ermitaño",
      "Greenhills", "Halo-Halo", "Isabelita", "Kabayanan", "Little Baguio",
      "Maytunas", "Onse", "Pasadeña", "Pedro Cruz", "Progreso", "Rivera",
      "Salapan", "San Perfecto", "Santa Lucia", "Tibagan", "West Crame"
    ];
    const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
    const InventoryItem = mongoose.connection.model('InventoryItem', new mongoose.Schema({}, { strict: false }), 'inventoryitems');

    // Get available stock for Anti-Rabies vaccine
    const vaccineStock = await InventoryItem.aggregate([
      { $match: { type: 'Vaccine', name: /anti[- ]?rabies/i } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const availableAntiRabies = vaccineStock[0]?.total || 0;

    // For each barangay, count cases by severity
    const prescriptions = [];
    for (const barangay of barangays) {
      const cases = await BiteCase.find({ address: { $regex: barangay, $options: 'i' } });
      const severe = cases.filter(c => c.severity === 'high').length;
      const moderate = cases.filter(c => c.severity === 'medium').length;
      const mild = cases.filter(c => c.severity === 'low').length;
      const totalCases = cases.length;
      // Recommend: 3 per severe, 2 per moderate, 1 per mild, +20% buffer
      let recommended = Math.ceil((severe * 3 + moderate * 2 + mild * 1) * 1.2);
      if (totalCases > 0) recommended = Math.max(recommended, 10); // Minimum for active barangays
      const note = (availableAntiRabies < recommended) ? 'Stock insufficient!' : '';
      prescriptions.push({
        barangay,
        vaccineType: 'Anti-Rabies',
        totalCases,
        severeCases: severe,
        moderateCases: moderate,
        mildCases: mild,
        recommended,
        available: availableAntiRabies,
        note
      });
    }
    res.json({ success: true, prescriptions });
  } catch (err) {
    console.error('Error in prescribe-vaccine-distribution:', err);
    res.status(500).json({ success: false, message: 'Failed to prescribe vaccine distribution', error: err.message });
  }
});

// API: Rabies Exposure Registry Report
app.get('/api/reports/rabies-registry', async (req, res) => {
  try {
    const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
    const bitecases = await BiteCase.find({}).sort({ createdAt: 1 });
    const report = bitecases.map((p, idx) => ({
        registrationNo: p.registrationNumber || '',
        registrationDate: p.dateRegistered || (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''),
      name: p.lastName && p.firstName ? `${p.lastName}, ${p.firstName}${p.middleName ? ' ' + p.middleName : ''}`.trim() : (p.patientName || ''),
        contactNo: p.contactNo || '',
        address: p.address || '',
        age: p.age || '',
      sex: p.sex || p.gender || '',
        exposureDate: p.exposureDate || '',
      animalType: p.animalType || p.exposureSource || '',
      biteType: p.biteType || p.exposureType || '',
      biteSite: p.biteSite || '',
      status: p.status || '',
      createdAt: p.createdAt || '',
    }));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate rabies registry report', error: err.message });
  }
});

// API: Insert sample center data
app.post('/api/insert-sample-centers', async (req, res) => {
    try {
        const sampleCenters = [
            {
                centerName: "San Juan City Health Center",
                address: "N. Domingo St., San Juan City",
                contactPerson: "Dr. Maria Santos",
                contactNumber: "09123456789",
                isArchived: false,
                vaccines: [
                    { type: "Anti-Rabies", count: 150 },
                    { type: "Tetanus Toxoid", count: 100 }
                ]
            },
            {
                centerName: "Greenhills Medical Center",
                address: "Greenhills Shopping Center, San Juan City",
                contactPerson: "Dr. John Cruz",
                contactNumber: "09234567890",
                isArchived: false,
                vaccines: [
                    { type: "Anti-Rabies", count: 200 },
                    { type: "Tetanus Toxoid", count: 150 }
                ]
            },
            {
                centerName: "San Juan Medical Center",
                address: "Pinaglabanan St., San Juan City",
                contactPerson: "Dr. Robert Lim",
                contactNumber: "09345678901",
                isArchived: false,
                vaccines: [
                    { type: "Anti-Rabies", count: 180 },
                    { type: "Tetanus Toxoid", count: 120 }
                ]
            },
            {
                centerName: "Little Baguio Health Center",
                address: "Little Baguio, San Juan City",
                contactPerson: "Dr. Sarah Tan",
                contactNumber: "09456789012",
                isArchived: false,
                vaccines: [
                    { type: "Anti-Rabies", count: 120 },
                    { type: "Tetanus Toxoid", count: 80 }
                ]
            },
            {
                centerName: "Salapan Health Center",
                address: "Salapan Rd., San Juan City",
                contactPerson: "Dr. Michael Reyes",
                contactNumber: "09567890123",
                isArchived: false,
                vaccines: [
                    { type: "Anti-Rabies", count: 100 },
                    { type: "Tetanus Toxoid", count: 70 }
                ]
            }
        ];

        // Clear existing centers
        await Center.deleteMany({});
        console.log('Cleared existing centers');

        // Insert new centers
        const result = await Center.insertMany(sampleCenters);
        console.log(`Added ${result.length} sample centers`);

        res.json({ success: true, message: 'Sample centers added successfully', data: result });
    } catch (error) {
        console.error('Error adding sample centers:', error);
        res.status(500).json({ success: false, message: 'Failed to add sample centers', error: error.message });
    }
});

// API Endpoints for Prescriptive Analytics
app.get('/api/bitecases', async (req, res) => {
    try {
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        
        const { center, patientId, registrationNumber, name, firstName, lastName } = req.query;

        const filter = {};

        // Optional center filtering (role-based use on frontend)
        if (center) {
            filter.center = { $regex: center, $options: 'i' };
        }

        // Patient-based filtering for history modal
        const orConditions = [];
        if (patientId) {
            try {
                const maybeId = String(patientId).trim();
                if (mongoose.Types.ObjectId.isValid(maybeId)) {
                    orConditions.push({ patientId: new mongoose.Types.ObjectId(maybeId) });
                }
                // Also try plain string matches for legacy fields
                orConditions.push({ patientId: maybeId });
                orConditions.push({ patientID: maybeId });
            } catch (_) {
                // ignore
            }
        }
        if (registrationNumber) {
            const reg = String(registrationNumber).trim();
            orConditions.push({ registrationNumber: reg });
        }
        if (name) {
            const n = String(name).trim();
            orConditions.push({ patientName: { $regex: n, $options: 'i' } });
        }
        if (firstName && lastName) {
            const f = String(firstName).trim();
            const l = String(lastName).trim();
            orConditions.push({ firstName: { $regex: `^${f}$`, $options: 'i' }, lastName: { $regex: `^${l}$`, $options: 'i' } });
        }

        if (orConditions.length > 0) {
            filter.$or = orConditions;
        }

        const cases = await BiteCase.find(filter).sort({ createdAt: -1, incidentDate: -1 });
        res.json(cases);
    } catch (error) {
        console.error('Error fetching bite cases:', error);
        res.status(500).json({ error: 'Failed to fetch bite cases' });
    }
});

// --- Vaccination Dates Endpoints (for vaccination schedule modal) ---
// Collection name: vaccinationdates
app.get('/api/vaccinationdates', async (req, res) => {
    try {
        const VaccinationDate = mongoose.connection.model('VaccinationDate', new mongoose.Schema({}, { strict: false }), 'vaccinationdates');
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const { patientId, biteCaseId, center } = req.query;
        
        let filter = {};
        if (patientId) filter.patientId = patientId;
        if (biteCaseId) filter.biteCaseId = biteCaseId;
        
        // If center filtering is requested, we need to join with bite cases
        if (center) {
            // First, find bite cases that match the center
            const biteCaseFilter = { center: { $regex: center, $options: 'i' } };
            const matchingBiteCases = await BiteCase.find(biteCaseFilter, { _id: 1 });
            const biteCaseIds = matchingBiteCases.map(bc => bc._id);
            
            // Filter vaccination dates by these bite case IDs
            filter.biteCaseId = { $in: biteCaseIds };
        }
        
        const list = await VaccinationDate.find(filter).sort({ updatedAt: -1, createdAt: -1 });
        res.json(list);
    } catch (err) {
        console.error('Error fetching vaccinationdates:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch vaccination dates' });
    }
});

// Fetch a single vaccinationdates document by id
app.get('/api/vaccinationdates/:id', async (req, res) => {
    try {
        const VaccinationDate = mongoose.connection.model('VaccinationDate', new mongoose.Schema({}, { strict: false }), 'vaccinationdates');
        const item = await VaccinationDate.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Not found' });
        res.json(item);
    } catch (err) {
        console.error('Error fetching vaccinationdates by id:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch vaccination date' });
    }
});

// Update vaccinationdates by biteCaseId (or id fallback)
app.put('/api/vaccinationdates', async (req, res) => {
    try {
        const { biteCaseId } = req.query;
        const update = req.body || {};
        if (!biteCaseId) return res.status(400).json({ success: false, message: 'biteCaseId is required' });
        const VaccinationDate = mongoose.connection.model('VaccinationDate', new mongoose.Schema({}, { strict: false }), 'vaccinationdates');
        const result = await VaccinationDate.findOneAndUpdate({ biteCaseId }, { $set: update }, { new: true });
        if (!result) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error updating vaccinationdates (by biteCaseId):', err);
        res.status(500).json({ success: false, message: 'Failed to update vaccination date' });
    }
});

app.put('/api/vaccinationdates/:id', async (req, res) => {
    try {
        const VaccinationDate = mongoose.connection.model('VaccinationDate', new mongoose.Schema({}, { strict: false }), 'vaccinationdates');
        const result = await VaccinationDate.findByIdAndUpdate(req.params.id, { $set: req.body || {} }, { new: true });
        if (!result) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error updating vaccinationdates by id:', err);
        res.status(500).json({ success: false, message: 'Failed to update vaccination date' });
    }
});

// Upsert diagnosis/management for a bitecase document
app.put('/api/bitecases/:id/diagnosis', async (req, res) => {
    try {
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const { id } = req.params;
        const body = req.body || {};
        if (body.followUpDate) body.followUpDate = new Date(body.followUpDate);
        if (Array.isArray(body.followUps)) {
            body.followUps = body.followUps.map(f => ({ ...f, date: f.date ? new Date(f.date) : null }));
        }
        const update = { $set: { ...body, updatedAt: new Date() } };
        const doc = await BiteCase.findByIdAndUpdate(id, update, { new: true });
        if (!doc) return res.status(404).json({ success: false, message: 'Bite case not found' });
        return res.json({ success: true, data: doc });
    } catch (error) {
        console.error('Error updating diagnosis:', error);
        return res.status(500).json({ success: false, message: 'Failed to update diagnosis' });
    }
});

// Fetch single bitecase by patientId or registrationNumber
app.get('/api/bitecases/find', async (req, res) => {
    try {
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const { patientId, registrationNumber } = req.query;
        if (!patientId && !registrationNumber) return res.status(400).json({ success: false, message: 'Provide patientId or registrationNumber' });
        const query = patientId ? { patientId } : { registrationNumber };
        const doc = await BiteCase.findOne(query).sort({ createdAt: -1 });
        if (!doc) return res.status(404).json({ success: false, message: 'Record not found' });
        return res.json({ success: true, data: doc });
    } catch (error) {
        console.error('Error fetching bitecase by key:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch bitecase' });
    }
});

// Create a new bitecase (minimal create from Diagnosis module)
app.post('/api/bitecases', async (req, res) => {
    try {
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const payload = req.body || {};
        const doc = new BiteCase({ ...payload, createdAt: new Date(), updatedAt: new Date() });
        await doc.save();
        return res.status(201).json({ success: true, data: doc });
    } catch (error) {
        console.error('Error creating bitecase:', error);
        return res.status(500).json({ success: false, message: 'Failed to create bitecase' });
    }
});

app.get('/api/inventory', async (req, res) => {
    try {
        const inventory = await InventoryItem.find({ type: 'Vaccine' })
            .select('name quantity unit minThreshold expiryDate status')
            .sort({ name: 1 });
        res.json(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory data' });
    }
});

// One-time migration endpoint to split fullName into firstName, middleName, lastName
app.post('/api/migrate-staff-names', async (req, res) => {
    try {
        const staffs = await Staff.find({ fullName: { $exists: true, $ne: null } });
        let updated = 0;
        for (const staff of staffs) {
            if (!staff.firstName && staff.fullName) {
                const parts = staff.fullName.trim().split(' ');
                staff.firstName = parts[0] || '';
                if (parts.length === 3) {
                    staff.middleName = parts[1];
                    staff.lastName = parts[2];
                } else if (parts.length === 2) {
                    staff.middleName = '';
                    staff.lastName = parts[1];
                } else {
                    staff.middleName = '';
                    staff.lastName = '';
                }
                await staff.save();
                updated++;
            }
        }
        res.json({ success: true, updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/cases-per-barangay', async (req, res) => {
    try {
        const { center } = req.query;
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        
        let filter = {};
        if (center) {
            // Filter by center name in address field (case-insensitive)
            filter.address = { $regex: center, $options: 'i' };
        }
        
        const cases = await BiteCase.find(filter);
        const counts = {};
        cases.forEach(c => {
            const barangay = c.barangay || 'Unknown';
            counts[barangay] = (counts[barangay] || 0) + 1;
        });
        res.json({ success: true, data: Object.entries(counts).map(([barangay, count]) => ({ barangay, count })) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/patient-growth', async (req, res) => {
    try {
        const { center } = req.query;
        const Patient = mongoose.connection.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                label: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                month: d.getMonth()
            });
        }
        const counts = await Promise.all(months.map(async m => {
            const start = new Date(m.year, m.month, 1);
            const end = new Date(m.year, m.month + 1, 1);
            let filter = { createdAt: { $gte: start, $lt: end } };
            if (center) {
                filter.center = center;
            }
            const count = await Patient.countDocuments(filter);
            return count;
        }));
        res.json({ success: true, labels: months.map(m => m.label), data: counts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/vaccine-stock-trends', async (req, res) => {
    try {
        const { center } = req.query;
        const InventoryItem = mongoose.connection.model('InventoryItem', new mongoose.Schema({}, { strict: false }), 'inventoryitems');
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                label: d.toLocaleString('default', { month: 'short' }),
                year: d.getFullYear(),
                month: d.getMonth()
            });
        }
        // For each month, sum the quantity of all items as of the end of that month
        const data = await Promise.all(months.map(async m => {
            const end = new Date(m.year, m.month + 1, 1);
            let filter = { lastUpdated: { $lt: end } };
            if (center) {
                filter.center = center;
            }
            const items = await InventoryItem.find(filter);
            return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        }));

        // FIX: For the latest month, use the current total from vaccinestocks
        if (months.length > 0) {
            const VaccineStock = mongoose.connection.model('VaccineStock', new mongoose.Schema({}, { strict: false }), 'vaccinestocks');
            let stockFilter = {};
            if (center) {
                // Handle center name variations for vaccine stocks
                stockFilter.$or = [
                    { centerName: center },
                    { centerName: center + ' Center' },
                    { centerName: center + ' Health Center' }
                ];
            }
            const allStocks = await VaccineStock.find(stockFilter);
            const currentTotal = allStocks.reduce((sum, item) => sum + (item.quantity || 0), 0);
            data[data.length - 1] = currentTotal;
        }

        res.json({ success: true, labels: months.map(m => m.label), data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/severity-distribution', async (req, res) => {
    try {
        const { center } = req.query;
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        
        let filter = {};
        if (center) {
            // Filter by center name in address field (case-insensitive)
            filter.address = { $regex: center, $options: 'i' };
        }
        
        const cases = await BiteCase.find(filter);
        // Support both new (I, II, III) and old (A, B, C) values
        const severityMap = { I: 'Mild', II: 'Moderate', III: 'Severe', A: 'Mild', B: 'Moderate', C: 'Severe' };
        const counts = { Mild: 0, Moderate: 0, Severe: 0 };
        cases.forEach(c => {
            const sev = severityMap[c.exposureCategory];
            if (sev) counts[sev]++;
        });
        res.json({ success: true, data: counts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch severity distribution', error: error.message });
    }
});

// Animal Bite Exposure Report API
app.get('/api/reports/animal-bite-exposure', async (req, res) => {
    try {
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        
        // Build filter for center-based access
        let filter = {};
        const { center } = req.query;
        if (center) {
            filter.center = { $regex: center, $options: 'i' };
        }
        
        const cases = await BiteCase.find(filter).sort({ createdAt: 1 });

    const report = cases.map((c, idx) => {
      // Patient Name: FirstName MiddleName LastName (skip missing parts)
      let name = [c.firstName, c.middleName, c.lastName].filter(Boolean).join(' ');
      if (!name && c.patientName) {
        name = c.patientName;
      }

      // Address logic
      let addressParts = [
        c.houseNo,
        c.street,
        c.barangay,
        c.subdivision,
        c.city,
        c.province,
        c.zipCode
      ];
      let address = addressParts.filter(Boolean).join(', ');

      // Bite Site logic
      let biteSite = c.biteSite || c.exposurePlace || '';

      return {
        caseNo: c.caseNo || c.registrationNumber || '',
        date: c.dateRegistered || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''),
        name,
        age: c.age || '',
        sex: c.sex || c.gender || '',
        address,
        animalType: c.animalType || c.exposureSource || '',
        biteSite,
        status: c.status || '',
        exposureDate: c.exposureDate || '',
        createdAt: c.createdAt || '',
      };
    });

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('Error in /api/reports/animal-bite-exposure:', err);
    res.status(500).json({ success: false, message: 'Failed to generate animal bite exposure report', error: err.message });
    }
});

// Rabies Utilization Report API
app.get('/api/reports/rabies-utilization', async (req, res) => {
    try {
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        
        // Build filter for center-based access
        let filter = {};
        const { center } = req.query;
        if (center) {
            filter.center = { $regex: center, $options: 'i' };
        }
        
        const bitecases = await BiteCase.find(filter);
        const report = bitecases.map(p => {
            // Extract vaccine information from currentImmunization.doseMedicines
            let vaccineUsed = '';
            if (p.currentImmunization && p.currentImmunization.doseMedicines && Array.isArray(p.currentImmunization.doseMedicines)) {
                const medicines = p.currentImmunization.doseMedicines
                    .filter(med => med.medicineUsed && med.medicineUsed.trim() !== '')
                    .map(med => med.medicineUsed);
                vaccineUsed = medicines.join(', ');
            }
            
            return {
            dateRegistered: p.dateRegistered,
            center: p.center || '',
            firstName: p.firstName || '',
            middleName: p.middleName || '',
            lastName: p.lastName || '',
                brandName: vaccineUsed, // Use the extracted vaccine information
                genericName: vaccineUsed // Use the same for both fields
            };
        });
        res.json({ success: true, data: report });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate rabies utilization report', error: err.message });
    }
});

// --- PATIENT REGISTRATION ENDPOINT (EXAMPLE) ---
// If you have a patient registration endpoint, add audit logging like this:
app.post('/api/patients', async (req, res) => {
    try {
        const { firstName, middleName, lastName, birthdate, gender, contactNumber, address, ...rest } = req.body;
        // Validate required fields (add as needed)
        if (!firstName || !lastName || !birthdate || !gender || !contactNumber || !address) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        // Create new patient (assuming you have a Patient model)
        const Patient = mongoose.connection.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
        const newPatient = new Patient({
            firstName,
            middleName,
            lastName,
            birthdate,
            gender,
            contactNumber,
            address,
            ...rest,
            createdAt: new Date(),
            status: 'active'
        });
        await newPatient.save();
        // Log audit trail for patient registration
        await logAuditTrail(
            newPatient._id,
            'patient',
            newPatient.firstName,
            newPatient.middleName,
            newPatient.lastName,
            'Registered'
        );
        res.status(201).json({ success: true, patient: newPatient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PATIENT LIST & FETCH ENDPOINTS ---
app.get('/api/patients', async (req, res) => {
    try {
        const Patient = mongoose.connection.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
        const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
        const { q, status, vaccinationDay, barangay, dateFilter, vaccinationDate, page = 1, limit = 20, sort = '-createdAt', center } = req.query;

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

        let filter = {};
        
        // Handle center filtering for role-based access
        if (center) {
            filter.center = center;
        }
        
        // Handle vaccination day filtering
        if (vaccinationDay) {
            // First, find bite cases that have the specified vaccination day
            const biteCaseFilter = {};
            
            // Map vaccination day to the corresponding date field
            const vaccinationDateFields = {
                'day0': ['day0Date', 'day0_date', 'd0Date'],
                'day3': ['day3Date', 'day3_date', 'd3Date'],
                'day7': ['day7Date', 'day7_date', 'd7Date'],
                'day14': ['day14Date', 'day14_date', 'd14Date'],
                'day28': ['day28Date', 'day28_date', 'd28Date']
            };
            
            const dateFields = vaccinationDateFields[vaccinationDay] || [];
            if (dateFields.length > 0) {
                if (vaccinationDate) {
                    // If specific vaccination date is provided, filter by that date
                    const selectedDate = new Date(vaccinationDate);
                    const startOfDay = new Date(selectedDate);
                    startOfDay.setHours(0, 0, 0, 0);
                    const endOfDay = new Date(selectedDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    
                    biteCaseFilter.$or = dateFields.map(field => ({
                        [field]: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        }
                    }));
                } else {
                    // If no specific date, just check if the vaccination day exists
                    biteCaseFilter.$or = dateFields.map(field => ({ [field]: { $exists: true, $ne: null } }));
                }
            }
            
            // Find bite cases with the specified vaccination day
            const biteCases = await BiteCase.find(biteCaseFilter);
            
            // Extract patient IDs from bite cases
            const patientIds = biteCases.map(case_ => {
                // Try to match by patient ID, registration number, or name
                return case_.patientId || case_.patientID || case_._id;
            }).filter(Boolean);
            
            if (patientIds.length > 0) {
                filter._id = { $in: patientIds };
            } else {
                // If no bite cases found, return empty result
                return res.json({
                    success: true,
                    data: [],
                    page: pageNumber,
                    limit: pageSize,
                    total: 0,
                    totalPages: 0
                });
            }
        }
        
        // Handle other filters
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (barangay) {
            filter.barangay = { $regex: barangay, $options: 'i' };
        }
        
        if (dateFilter) {
            const selectedDate = new Date(dateFilter);
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);
            
            filter.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }
        
        if (q && q.trim()) {
            const term = q.trim();
            filter.$or = [
                { firstName: { $regex: term, $options: 'i' } },
                { middleName: { $regex: term, $options: 'i' } },
                { lastName: { $regex: term, $options: 'i' } },
                { contactNumber: { $regex: term, $options: 'i' } },
                { address: { $regex: term, $options: 'i' } }
            ];
        }

        const total = await Patient.countDocuments(filter);
        const patients = await Patient.find(filter)
            .sort(sort)
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        // Calculate age from birthdate for each patient
        const patientsWithAge = patients.map(patient => {
            let age = '';
            if (patient.birthdate) {
                const birthDate = new Date(patient.birthdate);
                const today = new Date();
                let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    calculatedAge--;
                }
                
                age = calculatedAge.toString();
            }
            
            return {
                ...patient.toObject(),
                age: age
            };
        });

        res.json({
            success: true,
            data: patientsWithAge,
            page: pageNumber,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/patients/:id', async (req, res) => {
    try {
        const Patient = mongoose.connection.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PATIENT UPDATE ENDPOINT (EXAMPLE) ---
app.put('/api/patients/:id', async (req, res) => {
    try {
        const Patient = mongoose.connection.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        // Log audit trail for patient update
        await logAuditTrail(
            patient._id,
            'patient',
            patient.firstName,
            patient.middleName,
            patient.lastName,
            'Updated profile'
        );
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PATIENT STATUS CHANGE (DEACTIVATE/ACTIVATE) ---
app.post('/api/patients/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // e.g., 'active', 'inactive', 'deceased'
        const Patient = mongoose.connection.model('Patient', new mongoose.Schema({}, { strict: false }), 'patients');
        const patient = await Patient.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        // Log audit trail for status change
        await logAuditTrail(
            patient._id,
            'patient',
            patient.firstName,
            patient.middleName,
            patient.lastName,
            `Status changed to ${status}`
        );
        res.json({ success: true, patient });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- VaccineStocks Schema and API ---
const vaccineStockSchema = new mongoose.Schema({
  center: String,
  vaccineName: String,
  quantity: Number,
  expiryDate: Date,
  batchNumber: String,
  minThreshold: Number,
  status: String,
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'vaccinestocks' });

const VaccineStock = mongoose.model('VaccineStock', vaccineStockSchema);

// API: Get all vaccine stocks
app.get('/api/vaccinestocks', async (req, res) => {
  try {
    const { center } = req.query;
    
    // Use flexible schema to match the actual nested vaccinestocks structure
    const VaccineStockDoc = mongoose.connection.model('VaccineStockDoc', new mongoose.Schema({}, { strict: false }), 'vaccinestocks');
    
    // Build filter for center-based access
    let filter = {};
    if (center) {
      // Handle different center name formats
      filter.$or = [
        { centerName: center },
        { centerName: center + ' Center' },
        { centerName: center.replace(' Center', '') }
      ];
    }
    
    const docs = await VaccineStockDoc.find(filter);
    
    // Transform nested structure to flat structure for frontend
    const stocks = [];
    docs.forEach(doc => {
      if (doc.vaccines && Array.isArray(doc.vaccines)) {
        doc.vaccines.forEach(vaccine => {
          if (vaccine.stockEntries && Array.isArray(vaccine.stockEntries)) {
            vaccine.stockEntries.forEach(entry => {
              stocks.push({
                _id: entry._id,
                center: doc.centerName,
                vaccineName: vaccine.name,
                vaccineType: vaccine.brand,
                category: vaccine.type,
                batchNumber: entry.branchNo,
                quantity: entry.stock,
                expiryDate: entry.expirationDate,
                status: entry.stock <= 0 ? 'out' : entry.stock <= 10 ? 'low' : 'active',
                lastUpdated: new Date()
              });
            });
          }
        });
      }
    });
    
    // Sort by last updated
    stocks.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    res.json({ success: true, data: stocks });
  } catch (err) {
    console.error('Error fetching vaccine stocks:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch vaccine stocks', error: err.message });
    }
});

// API: Add new vaccine stock
app.post('/api/vaccinestocks', async (req, res) => {
  try {
    const { center, vaccineName, quantity, expiryDate, batchNumber, minThreshold } = req.body;
    
    // Validate required fields
    if (!center || !vaccineName || quantity === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Center, vaccine name, and quantity are required' 
      });
    }

    // Create new vaccine stock entry
    const newStock = new VaccineStock({
      center,
      vaccineName,
      quantity: parseInt(quantity),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      batchNumber: batchNumber || '',
      minThreshold: minThreshold ? parseInt(minThreshold) : 10,
      status: quantity <= 0 ? 'out' : quantity <= (minThreshold || 10) ? 'low' : 'active',
      lastUpdated: new Date()
    });

    await newStock.save();
    res.json({ success: true, data: newStock, message: 'Vaccine stock added successfully' });
  } catch (err) {
    console.error('Error adding vaccine stock:', err);
    res.status(500).json({ success: false, message: 'Failed to add vaccine stock', error: err.message });
  }
});

// API: Update vaccine stock
app.put('/api/vaccinestocks/:id', async (req, res) => {
  try {
    const { center, vaccineName, quantity, expiryDate, batchNumber, minThreshold } = req.body;
    
    const stock = await VaccineStock.findById(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Vaccine stock not found' });
    }

    // Update fields
    if (center) stock.center = center;
    if (vaccineName) stock.vaccineName = vaccineName;
    if (quantity !== undefined) {
      stock.quantity = parseInt(quantity);
      // Update status based on new quantity
      const threshold = minThreshold || stock.minThreshold || 10;
      stock.status = stock.quantity <= 0 ? 'out' : stock.quantity <= threshold ? 'low' : 'active';
    }
    if (expiryDate) stock.expiryDate = new Date(expiryDate);
    if (batchNumber !== undefined) stock.batchNumber = batchNumber;
    if (minThreshold !== undefined) stock.minThreshold = parseInt(minThreshold);
    
    stock.lastUpdated = new Date();
    await stock.save();

    res.json({ success: true, data: stock, message: 'Vaccine stock updated successfully' });
  } catch (err) {
    console.error('Error updating vaccine stock:', err);
    res.status(500).json({ success: false, message: 'Failed to update vaccine stock', error: err.message });
  }
});

// API: Delete vaccine stock
app.delete('/api/vaccinestocks/:id', async (req, res) => {
  try {
    const stock = await VaccineStock.findByIdAndDelete(req.params.id);
    if (!stock) {
      return res.status(404).json({ success: false, message: 'Vaccine stock not found' });
    }
    res.json({ success: true, message: 'Vaccine stock deleted successfully' });
  } catch (err) {
    console.error('Error deleting vaccine stock:', err);
    res.status(500).json({ success: false, message: 'Failed to delete vaccine stock', error: err.message });
  }
});

// Center-scoped FIFO stock update for nested vaccinestocks structure
// Expected body: { centerName, itemName, brand, type, quantity, operation, reason, patientId }
app.post('/api/stock/update', async (req, res) => {
  try {
    const { centerName, itemName, brand, type, quantity, operation } = req.body || {};

    if (!centerName || !itemName || !operation || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'centerName, itemName, operation, quantity are required' });
    }

    // Use flexible schema to match your nested vaccinestocks documents
    const VaccineStockDoc = mongoose.connection.model('VaccineStockDoc', new mongoose.Schema({}, { strict: false }), 'vaccinestocks');

    const doc = await VaccineStockDoc.findOne({ $or: [ { centerName }, { center: centerName } ] });
    if (!doc) {
      return res.status(404).json({ success: false, message: `Center not found: ${centerName}` });
    }

    if (!Array.isArray(doc.vaccines)) {
      return res.status(400).json({ success: false, message: 'Invalid vaccinestocks structure: vaccines array missing' });
    }

    // Find vaccine entry by name and brand/type if provided
    let vi = doc.vaccines.findIndex(v => {
      const nameMatch = (v.name || v.vaccineName || '').toLowerCase() === String(itemName).toLowerCase();
      const brandMatch = brand ? String(v.brand || '').toLowerCase() === String(brand).toLowerCase() : true;
      const typeMatch = type ? String(v.type || '').toLowerCase() === String(type).toLowerCase() : true;
      return nameMatch && brandMatch && typeMatch;
    });

    if (vi === -1) {
      return res.status(404).json({ success: false, message: `Vaccine ${itemName} (${brand || ''}) not found for center ${centerName}` });
    }

    const vaccineEntry = doc.vaccines[vi];
    if (!Array.isArray(vaccineEntry.stockEntries)) {
      vaccineEntry.stockEntries = [];
    }

    let qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive number' });
    }

    if (operation === 'deduct') {
      // FIFO by earliest expirationDate
      vaccineEntry.stockEntries.sort((a, b) => {
        const da = new Date(a.expirationDate).getTime() || 0;
        const db = new Date(b.expirationDate).getTime() || 0;
        return da - db;
      });

      for (const entry of vaccineEntry.stockEntries) {
        const available = parseFloat(entry.stock) || 0;
        if (available <= 0) continue;
        const take = Math.min(available, qty);
        entry.stock = Number((available - take).toFixed(2));
        qty = Number((qty - take).toFixed(2));
        if (qty <= 0) break;
      }

      if (qty > 0) {
        return res.status(409).json({ success: false, message: 'Insufficient stock to deduct requested quantity' });
      }
    } else if (operation === 'add') {
      // Add back to the latest (or create a generic bucket)
      const nowBucket = vaccineEntry.stockEntries && vaccineEntry.stockEntries[0] ? vaccineEntry.stockEntries[0] : null;
      if (nowBucket) {
        const current = parseFloat(nowBucket.stock) || 0;
        nowBucket.stock = Number((current + qty).toFixed(2));
      } else {
        vaccineEntry.stockEntries = [ { expirationDate: null, branchNo: '000', stock: Number(qty.toFixed(2)) } ];
      }
    } else {
      return res.status(400).json({ success: false, message: `Unsupported operation: ${operation}` });
    }

    // Persist changes
    doc.markModified('vaccines');
    await doc.save();

    return res.json({ success: true, message: 'Stock updated', data: doc });
  } catch (err) {
    console.error('Error updating stock (center-scoped):', err);
    return res.status(500).json({ success: false, message: 'Failed to update stock', error: err.message });
  }
});

// Helper to generate next adminID or superAdminID
async function getNextAdminID() {
    const lastAdmin = await Admin.findOne({}).sort({ adminID: -1 }).select('adminID');
    let next = 1;
    if (lastAdmin && lastAdmin.adminID) {
        const num = parseInt(lastAdmin.adminID.replace('AD', ''));
        if (!isNaN(num)) next = num + 1;
    }
    return `AD${String(next).padStart(3, '0')}`;
}
async function getNextSuperAdminID() {
    const lastSuper = await SuperAdmin.findOne({}).sort({ superAdminID: -1 }).select('superAdminID');
    let next = 1;
    if (lastSuper && lastSuper.superAdminID) {
        const num = parseInt(lastSuper.superAdminID.replace('SA', ''));
        if (!isNaN(num)) next = num + 1;
    }
    return `SA${String(next).padStart(3, '0')}`;
}

// Helper to get the correct audit user ID
function getAuditUserId(user) {
    if (!user) return '';
    if (user.role === 'admin' && user.adminID) return user.adminID;
    if (user.role === 'superadmin' && user.superAdminID) return user.superAdminID;
    if (user.role === 'staff' && user.staffID) return user.staffID;
    if (user.role === 'patient' && user.patientID) return user.patientID;
    return user._id;
}

// Get service hours for a center
app.get('/api/centers/:id/service-hours', async (req, res) => {
  try {
    const center = await Center.findById(req.params.id);
    if (!center) return res.status(404).json({ success: false, message: 'Center not found' });
    res.json({ success: true, serviceHours: center.serviceHours || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch service hours', error: err.message });
  }
});

// Update service hours for a center
app.put('/api/centers/:id/service-hours', async (req, res) => {
  try {
    const { serviceHours } = req.body;
    if (!Array.isArray(serviceHours)) return res.status(400).json({ success: false, message: 'Invalid service hours format' });
    const center = await Center.findByIdAndUpdate(
      req.params.id,
      { serviceHours, lastUpdated: new Date() },
      { new: true }
    );
    if (!center) return res.status(404).json({ success: false, message: 'Center not found' });
    res.json({ success: true, serviceHours: center.serviceHours });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update service hours', error: err.message });
  }
});

// API: Custom Demographic Report
app.get('/api/reports/demographic', async (req, res) => {
  try {
    const { sex = 'all', ageGroup = 'all', center } = req.query;
    const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
    let filter = {};
    
    // Add center filtering if provided
    if (center) {
      filter.center = { $regex: center, $options: 'i' };
    }
    if (sex && sex !== 'all') {
      filter.$or = [
        { sex: sex },
        { gender: sex },
        { sex: sex.charAt(0) },
        { gender: sex.charAt(0) }
      ];
    }
    if (ageGroup && ageGroup !== 'all') {
      let ageCond = {};
      if (ageGroup === '0-5') ageCond = { $gte: 0, $lte: 5 };
      else if (ageGroup === '6-12') ageCond = { $gte: 6, $lte: 12 };
      else if (ageGroup === '13-18') ageCond = { $gte: 13, $lte: 18 };
      else if (ageGroup === '19-35') ageCond = { $gte: 19, $lte: 35 };
      else if (ageGroup === '36-60') ageCond = { $gte: 36, $lte: 60 };
      else if (ageGroup === '61+') ageCond = { $gte: 61 };
      if (Object.keys(ageCond).length > 0) filter.age = ageCond;
    }
    const cases = await BiteCase.find(filter).sort({ createdAt: 1 });
    const report = cases.map((p, idx) => ({
      registrationNo: p.registrationNumber || '',
      registrationDate: p.dateRegistered || (p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ''),
      name: p.lastName && p.firstName ? `${p.lastName}, ${p.firstName}${p.middleName ? ' ' + p.middleName : ''}`.trim() : (p.patientName || ''),
      sex: p.sex || p.gender || '',
      age: p.age || '',
      exposureDate: p.exposureDate || '',
      animalType: p.animalType || p.exposureSource || '',
      biteType: p.biteType || p.exposureType || '',
      biteSite: p.biteSite || '',
      barangay: p.barangay || '',
      address: p.address || (() => {
        const parts = [p.houseNo, p.street, p.barangay, p.city, p.province].filter(Boolean);
        return parts.join(', ') || '';
      })(),
      contactNo: p.contactNo || '',
      status: p.status || '',
      createdAt: p.createdAt || '',
    }));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate demographic report', error: err.message });
  }
});

// --- General Report (NEW ENDPOINT) ---
app.get('/api/reports/general', async (req, res) => {
  try {
    const BiteCase = mongoose.connection.model('BiteCase', new mongoose.Schema({}, { strict: false }), 'bitecases');
    const cases = await BiteCase.find({}).sort({ createdAt: 1 });
    const report = cases.map((c, idx) => ({
      registrationNo: c.registrationNumber || '',
      registrationDate: c.dateRegistered || (c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''),
      name: c.lastName && c.firstName ? `${c.lastName}, ${c.firstName}${c.middleName ? ' ' + c.middleName : ''}`.trim() : (c.patientName || ''),
      sex: c.sex || c.gender || '',
      age: c.age || '',
      address: c.address || '',
      contactNo: c.contactNo || '',
      barangay: c.barangay || '',
      animalType: c.animalType || c.exposureSource || '',
      biteType: c.biteType || c.exposureType || '',
      biteSite: c.biteSite || '',
      exposureDate: c.exposureDate || '',
      status: c.status || '',
      createdAt: c.createdAt || '',
      // Add any other fields you want to include
    }));
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate general report', error: err.message });
  }
});

// --- Center Hours Model and API ---
// Widen schema to support both legacy (weekday/sat/sun) and new (Mon-Fri + contact) shapes
const centerHoursSchema = new mongoose.Schema({
  // legacy fields
  name: { type: String },
  location: { type: String, default: '' },
  address: { type: String, default: '' },
  hours: { type: mongoose.Schema.Types.Mixed },
  // new fields
  centerId: { type: String },
  centerName: { type: String },
  contactNumber: { type: String, default: '' },
  updatedAt: { type: Date },
}, { collection: 'center_hours' });

const CenterHours = mongoose.models.CenterHours || mongoose.model('CenterHours', centerHoursSchema);

// GET all center hours
app.get('/api/center-hours', async (req, res) => {
  try {
    const centers = await CenterHours.find();
    res.json(centers);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch center hours', error: err.message });
  }
});

// Mirror route using underscore to match new client
app.get('/api/center_hours', async (req, res) => {
  try {
    const centers = await CenterHours.find();
    res.json({ success: true, data: centers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch center_hours', error: err.message });
  }
});

// POST update center hours
app.post('/api/center-hours/update', async (req, res) => {
  try {
    const { name, location, hours } = req.body;
    const updated = await CenterHours.findOneAndUpdate(
      { name },
      { location, hours },
      { new: true, upsert: true }
    );
    res.json({ success: true, center: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update center hours', error: err.message });
  }
});

// New save endpoints (underscore)
app.put('/api/center_hours/:centerId', async (req, res) => {
  try {
    const { centerId } = req.params;
    const { centerName, hours, contactNumber } = req.body;
    if (!centerId) return res.status(400).json({ success: false, message: 'centerId is required' });
    const updated = await CenterHours.findOneAndUpdate(
      { centerId },
      { centerId, centerName, hours, contactNumber, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save center_hours', error: err.message });
  }
});

app.post('/api/center_hours', async (req, res) => {
  try {
    const { centerId, centerName, hours, contactNumber } = req.body;
    const query = centerId ? { centerId } : { centerName };
    if (!query.centerId && !query.centerName) {
      return res.status(400).json({ success: false, message: 'centerId or centerName is required' });
    }
    const updated = await CenterHours.findOneAndUpdate(
      query,
      { centerId, centerName, hours, contactNumber, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save center_hours', error: err.message });
  }
});

// Real-time full name uniqueness check endpoint
app.get('/api/check-name-exists', async (req, res) => {
    const { firstName = '', middleName = '', lastName = '' } = req.query;
    if (!firstName.trim() || !lastName.trim()) {
        return res.json({ exists: false });
    }
    const trimmedFirst = firstName.trim();
    const trimmedMiddle = (middleName || '').trim();
    const trimmedLast = lastName.trim();
    const nameQuery = {
        firstName: { $regex: `^${trimmedFirst}$`, $options: 'i' },
        lastName: { $regex: `^${trimmedLast}$`, $options: 'i' },
        $or: [
            { $or: [ { middleName: { $exists: false } }, { middleName: '' } ] },
            { middleName: { $regex: `^${trimmedMiddle}$`, $options: 'i' } }
        ]
    };
    const exists = await Admin.findOne(nameQuery) || await SuperAdmin.findOne(nameQuery);
    res.json({ exists: !!exists });
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});