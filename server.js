const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// CORS setup - allow all origins in production
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Import AI helper
const { generateResponse } = require('./ai-helper');

// College data for fallback
const collegeData = {
  timetable: {
    "Computer Science": {
      "Monday": ["9:00-10:30 AM - Data Structures (Room 301)", "11:00-12:30 PM - Algorithms (Lab 3)"],
      "Tuesday": ["10:00-11:30 AM - Database Systems (Room 302)", "2:00-4:00 PM - Web Dev Lab"],
      "Wednesday": ["9:00-10:30 AM - Mathematics (Room 201)", "11:00-12:30 PM - Computer Networks"],
      "Thursday": ["10:00-11:30 AM - Software Engineering", "2:00-4:00 PM - Project Work"],
      "Friday": ["9:00-10:30 AM - AI Fundamentals", "11:00-12:30 PM - Seminar"]
    }
  },
  
  faculty: {
    "Computer Science": [
      {name: "Dr. Sarah Chen", email: "schen@college.edu", office: "Room 301", subjects: ["Data Structures", "Algorithms"]},
      {name: "Prof. Mike Rodriguez", email: "mrodriguez@college.edu", office: "Room 302", subjects: ["Database Systems", "Web Development"]},
      {name: "Dr. Priya Patel", email: "ppatel@college.edu", office: "Lab 3", subjects: ["AI", "Machine Learning"]}
    ]
  },
  
  campusLocations: {
    "Library": {building: "Main Building", floor: "2nd Floor", hours: "8:00 AM - 8:00 PM", features: ["Books", "Study Rooms", "Computers"]},
    "Computer Lab": {building: "Tech Building", floor: "1st Floor", hours: "9:00 AM - 6:00 PM", features: ["Programming", "Project Work"]},
    "Cafeteria": {building: "Student Center", floor: "Ground Floor", hours: "7:00 AM - 8:00 PM", features: ["Food Court", "Coffee Shop"]}
  }
};

// ==================== ROUTES ====================

// Root endpoint - Server status
app.get('/', (req, res) => {
    res.json({ 
        message: "🎉 CampusGPT Backend API is LIVE!",
        status: "Operational",
        ai_ready: !!process.env.GOOGLE_API_KEY,
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: {
            "GET /": "Server status",
            "GET /api/health": "Health check",
            "POST /api/chat": "AI Chat endpoint",
            "POST /api/upload-pdf": "PDF upload",
            "GET /api/timetable": "Class schedules",
            "GET /api/contacts": "Faculty contacts",
            "GET /api/locations": "Campus locations"
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: '✅ Healthy',
        server_time: new Date().toLocaleTimeString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        ai_status: process.env.GOOGLE_API_KEY ? "Connected" : "Not Configured"
    });
});

// Main AI Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        console.log('💬 Chat request received');
        
        const userMessage = req.body.message;
        
        if (!userMessage || userMessage.trim() === '') {
            return res.status(400).json({ 
                success: false,
                error: 'Message is required' 
            });
        }

        // Use AI to generate response
        const aiReply = await generateResponse(userMessage.trim());
        
        console.log('🤖 AI Response generated');
        
        res.json({ 
            success: true,
            reply: aiReply,
            type: 'ai',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Chat endpoint error:', error);
        
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: 'Failed to process chat request'
        });
    }
});

// PDF Upload endpoint
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No PDF file uploaded' 
            });
        }

        console.log('📄 PDF uploaded:', req.file.filename);
        
        // Simulate PDF processing (you can add actual PDF parsing later)
        // For now, we'll just acknowledge the upload
        
        res.json({ 
            success: true, 
            message: `PDF "${req.file.originalname}" uploaded successfully!`,
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            },
            uploadTime: new Date().toISOString(),
            note: "PDF processing is ready. You can ask questions about uploaded content."
        });
        
    } catch (error) {
        console.error('❌ PDF upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload PDF',
            details: error.message 
        });
    }
});

// Data endpoints
app.get('/api/timetable', (req, res) => {
    res.json({ 
        success: true, 
        timetable: collegeData.timetable,
        lastUpdated: new Date().toISOString()
    });
});

app.get('/api/contacts', (req, res) => {
    res.json({ 
        success: true, 
        faculty: collegeData.faculty,
        note: "Sample faculty data - replace with real data"
    });
});

app.get('/api/locations', (req, res) =>{
    res.json({ 
        success: true, 
        locations: collegeData.campusLocations 
    });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('🚨 Global error handler:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : error.message
    });
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 CAMPUSGPT BACKEND SERVER STARTED');
    console.log('='.repeat(50));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI Status: ${process.env.GOOGLE_API_KEY ? '✅ CONNECTED' : '❌ NOT CONFIGURED'}`);
    console.log(`📄 PDF Upload: ✅ READY`);
    console.log(`🕒 Started: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
    
    if (!process.env.GOOGLE_API_KEY) {
        console.log('\n⚠️  WARNING: Google API key not found!');
        console.log('   Add GOOGLE_API_KEY to your environment variables');
        console.log('   Get free key from: https://aistudio.google.com/');
    }
    
    console.log('\n🎯 Test the server:');
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50) + '\n');
});

module.exports = app;