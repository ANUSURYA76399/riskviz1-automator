// start.js
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { createRequire } from 'module';

// Initialize express app
const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(express.json());

// Setup for importing the routes
import 'ts-node/register/esm';
import('./src/routes/data-routes.js')
  .then((dataRoutesModule) => {
    const dataRoutes = dataRoutesModule.default;
    
    // Mount routes
    app.use('/', dataRoutes);
    
    // Root route for basic info
    app.get('/', (req, res) => {
      res.json({
        status: 'ok',
        message: 'RiskViz Automator API is running',
        availableRoutes: [
          '/health',
          '/upload',
          '/risk-data',
          '/points'
        ]
      });
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to load routes:', err);
  });
