import dataRoutes from './routes/data-routes.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import formidable from 'formidable';
import csv from 'csv-parser';
import pg from 'pg';

const app = express();
const PORT = process.env.PORT || 4000;

// Configure formidable for file uploads - much more reliable than multer
const formidableOptions = {
  uploadDir: 'uploads/',
  keepExtensions: true,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  filter: (part: any): boolean => {
    // Only accept CSV and Excel files
    if (part.name !== 'file') return false;
    if (!part.mimetype) return false;
    
    const isAcceptedType = 
      part.mimetype === 'text/csv' || 
      part.mimetype === 'application/vnd.ms-excel' ||
      part.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      (part.originalFilename && (
        part.originalFilename.endsWith('.csv') ||
        part.originalFilename.endsWith('.xls') ||
        part.originalFilename.endsWith('.xlsx')
      ));
    
    return Boolean(isAcceptedType);
  }
};

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory:', uploadsDir);
}

// Middleware with enhanced configuration
app.use(cors());

// Increase the limit for JSON bodies
app.use(express.json({ limit: '10mb' }));

// Configure URL-encoded bodies (important for form handling)
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Mount data routes with API prefix
app.use('/api', dataRoutes);

// Direct file upload handler using formidable instead of multer
app.post('/upload', (req: express.Request, res: express.Response) => {
  try {
    // Create a new formidable form instance
    const form = formidable(formidableOptions);
    
    // Parse the form using callback style to avoid issues
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Formidable parsing error:', err);
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
    
      // Handle files with proper type checking
      const fileArray = files.file;
      if (!fileArray || (Array.isArray(fileArray) && fileArray.length === 0)) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    
    console.log('File uploaded successfully:', {
      name: file.originalFilename,
      type: file.mimetype,
      size: file.size,
      path: file.filepath
    });
    
    // Process the file - instead of calling the route in data-routes.ts
    // we'll implement the logic directly here
    const fileRows: any[] = [];
    
    fs.createReadStream(file.filepath)
      .pipe(csv())
      .on('data', (row) => {
        fileRows.push(row);
      })
      .on('end', async () => {
        try {
          // Check if this is risk data format
          const isRiskData = fileRows.length > 0 && (
            'Respondent Type' in fileRows[0] ||
            'Risk Score' in fileRows[0] ||
            'Metric Name' in fileRows[0]
          );
          
          if (isRiskData) {
            console.log(`Processing ${fileRows.length} rows of risk data`);
            
            // Create database connection
            const pool = new pg.Pool({
              user: 'postgres',
              host: 'localhost',
              database: 'postgres',
              password: 'Anubhava95',
              port: 5432,
            });
            
            // Ensure risk_data table exists
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
            
            for (const row of fileRows) {
              try {
                // Log each row before inserting to verify data
                console.log('Inserting risk data row:', JSON.stringify(row));
                
                // Insert row into database
                await pool.query(
                  `INSERT INTO risk_data 
                  (respondent_type, hotspot, ao_location, phase, risk_score, likelihood, severity, risk_level, metric_name, timeline)
                  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
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
              } catch (insertError) {
                console.error('Error inserting row:', insertError);
                console.error('Problem row:', row);
                // Continue with other rows
              }
            }
            
            console.log(`Processed ${fileRows.length} risk data rows`);
            
          } else {
            // Process as simple x,y data
            console.log(`Processing ${fileRows.length} rows of x,y data`);
            
            // Create database connection
            const pool = new pg.Pool({
              user: 'postgres',
              host: 'localhost',
              database: 'postgres',
              password: 'Anubhava95',
              port: 5432,
            });
            
            // Create graph_points table if needed
            await pool.query(`
              CREATE TABLE IF NOT EXISTS graph_points (
                id SERIAL PRIMARY KEY,
                x FLOAT,
                y FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
            
            for (const row of fileRows) {
              try {
                // Log each point before inserting
                console.log('Inserting graph point:', JSON.stringify(row));
                await pool.query(
                  "INSERT INTO graph_points (x, y) VALUES ($1, $2) RETURNING id",
                  [parseFloat(row.x) || 0, parseFloat(row.y) || 0]
                );
              } catch (insertError) {
                console.error('Error inserting point:', insertError);
                console.error('Problem point:', row);
                // Continue processing other points
              }
            }
            
            console.log(`Processed ${fileRows.length} data points`);
          }
          
          // Clean up the uploaded file
          fs.unlink(file.filepath, (err) => {
            if (err) console.error("Error deleting file:", err);
          });
          
          res.json({ 
            success: true, 
            message: `Data inserted successfully: ${fileRows.length} rows processed`,
            rows: fileRows.length
          });
        } catch (err: any) {
          console.error("Error processing data:", err);
          res.status(500).json({ error: 'Failed to insert data: ' + err.message });
        }
      })
      .on('error', (error: Error) => {
        console.error("Error reading CSV file:", error);
        res.status(500).json({ error: 'Failed to parse file: ' + error.message });
      });
    });
  } catch (error: any) {
    console.error('Error in file upload handler:', error);
    res.status(500).json({ error: `File upload failed: ${error.message}` });
  }
});

// Error handling middleware - MUST be defined after routes
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Express error handler caught:', err);
  
  // Handle Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }
  
  // Handle Busboy/multipart form errors
  if (err.message && (err.message.includes('Unexpected') || err.message.includes('form'))) {
    return res.status(400).json({ error: `File upload error: ${err.message}. Try uploading a smaller file or a different format.` });
  }
  
  // Handle other errors
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  
  // Default error handler
  res.status(500).json({
    error: 'An unexpected error occurred',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Root route with API information
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'RiskViz Automator API is running',
    availableEndpoints: [
      { path: '/health', method: 'GET', description: 'Health check endpoint' },
      { path: '/upload', method: 'POST', description: 'Upload CSV data' },
      { path: '/risk-data', method: 'GET', description: 'Get risk data' },
      { path: '/points', method: 'GET', description: 'Get data points' },
      { path: '/api/test', method: 'GET', description: 'Test connection' }
    ]
  });
});

// Health check endpoint for frontend connection
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Test endpoint
app.get('/api/test', (_req, res) => {
  res.json({ message: 'Connected successfully ✅ from backend' });
});

// Sample data submission endpoint
app.post('/api/submit', (req, res) => {
  const data = req.body;
  res.json({ received: data });
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/`);
});
