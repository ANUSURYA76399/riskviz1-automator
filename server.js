import express from "express";
import cors from "cors";
import multer from "multer";
import pkg from "pg";
import fs from "fs";
import csv from "csv-parser";
import path from "path";

const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "Anubhava95",
  port: 5432,
});

// Initialize database table if it doesn't exist
const initDb = async () => {
  try {
    // Create graph_points table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS graph_points (
        id SERIAL PRIMARY KEY,
        x FLOAT,
        y FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create risk_data table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS risk_data (
        id SERIAL PRIMARY KEY,
        respondent_type TEXT,
        hotspot TEXT,
        ao_location TEXT,
        phase INTEGER,
        risk_score FLOAT,
        likelihood FLOAT,
        severity FLOAT,
        risk_level TEXT,
        metric_name TEXT,
        timeline TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Database tables initialized");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

// Call initDb on startup
initDb();

const app = express();
// Configure CORS to allow all requests from the frontend
app.use(cors());
app.use(express.json());

// Root route that shows available endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RiskViz Automator API is running',
    availableEndpoints: [
      { path: '/health', method: 'GET', description: 'Health check endpoint' },
      { path: '/upload', method: 'POST', description: 'Upload CSV data' },
      { path: '/api/points', method: 'GET', description: 'Get all data points' },
      { path: '/api/points', method: 'POST', description: 'Add a new data point' },
      { path: '/api/risk-data', method: 'GET', description: 'Get all risk data' },
      { path: '/api/risk-data', method: 'DELETE', description: 'Clear all risk data' }
    ]
  });
});

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

const upload = multer({ dest: "uploads/" });

// Upload endpoint for simple x,y data
app.post("/upload", upload.single("file"), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      try {
        // Clear the file after processing
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
        
        // Check if this is risk data format
        const isRiskData = results.length > 0 && (
          results[0].hasOwnProperty('Respondent Type') ||
          results[0].hasOwnProperty('Risk Score') ||
          results[0].hasOwnProperty('Metric Name')
        );
        
        if (isRiskData) {
          // Process as risk data
          for (const row of results) {
            await pool.query(
              `INSERT INTO risk_data 
               (respondent_type, hotspot, ao_location, phase, risk_score, likelihood, severity, risk_level, metric_name, timeline) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                row['Respondent Type'] || '',
                row['Hotspot'] || '',
                row['AO Location'] || row['AO'] || '',
                parseInt(row['Phase'] || '1'),
                parseFloat(row['Risk Score'] || row['RP Score'] || '0'),
                parseFloat(row['Likelihood'] || '0'),
                parseFloat(row['Severity'] || '0'),
                row['Risk Level'] || '',
                row['Metric Name'] || row['Metric'] || '',
                row['Timeline'] || ''
              ]
            );
          }
        } else {
          // Process as simple x,y data
          for (const row of results) {
            await pool.query(
              "INSERT INTO graph_points (x, y) VALUES ($1, $2)",
              [parseFloat(row.x) || 0, parseFloat(row.y) || 0]
            );
          }
        }
        
        res.send(`File data inserted into database: ${results.length} rows processed`);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
});

app.get("/api/points", async (req, res) => {
  const result = await pool.query("SELECT * FROM graph_points");
  res.json(result.rows);
});

app.post("/api/points", async (req, res) => {
  const { x, y } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO graph_points (x, y) VALUES ($1, $2) RETURNING *",
      [x, y]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get risk data endpoint
app.get("/api/risk-data", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM risk_data ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear risk data endpoint
app.delete("/api/risk-data", async (req, res) => {
  try {
    await pool.query("DELETE FROM risk_data");
    res.json({ message: "All risk data cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.listen(4000, () => console.log("Server running on port 4000"));
