import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));

const MAX_PAYLOAD = '100mb';
app.use(express.json({ limit: MAX_PAYLOAD }));
app.use(express.urlencoded({ limit: MAX_PAYLOAD, extended: true }));

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const DATA_DIR = path.resolve(__dirname, 'data');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// --- SQLITE DATABASE SETUP WITH PROPER INITIALIZATION ---
const dbPath = path.join(DATA_DIR, 'database.sqlite');
console.log(`[SQLite] Database path: ${dbPath}`);

// Initialize SQLite database directly first to ensure tables exist
const initSQLiteDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[SQLite] Failed to open database:', err.message);
        reject(err);
        return;
      }
      
      // Read and execute SQLite schema
      const schemaPath = path.join(__dirname, 'schema-sqlite.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (execErr) => {
          if (execErr) {
            console.error('[SQLite] Schema execution failed:', execErr.message);
          } else {
            console.log('[SQLite] Schema initialized successfully');
          }
          db.close();
          resolve();
        });
      } else {
        console.log('[SQLite] No schema file found, using Sequelize auto-sync');
        db.close();
        resolve();
      }
    });
  });
};

// Sequelize ORM setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: (msg) => console.log(`[Sequelize] ${msg}`),
  retry: {
    max: 5,
    timeout: 3000
  }
});

// Generic Model Generator
const defineGenericTable = (tableName) => {
  return sequelize.define(tableName, {
    data: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('data');
        try {
          return rawValue ? JSON.parse(rawValue) : null;
        } catch (e) {
          console.error(`[Sequelize] JSON parse error for ${tableName}:`, e.message);
          return null;
        }
      },
      set(value) {
        this.setDataValue('data', JSON.stringify(value));
      }
    }
  }, {
    timestamps: true,
    tableName: tableName
  });
};

// Define Models
const DB = {
  workers: defineGenericTable('workers'),
  invoices: defineGenericTable('invoices'),
  transactions: defineGenericTable('transactions'),
  attendance: defineGenericTable('attendance'),
  leaves: defineGenericTable('leaves'),
  payroll_runs: defineGenericTable('payroll_runs'),
  reminders: defineGenericTable('reminders'),
  company_profiles: defineGenericTable('company_profiles'),
  vouchers: defineGenericTable('vouchers'),
  milestones: defineGenericTable('milestones'),
  crm_data: defineGenericTable('crm_data'),
  active_clockins: defineGenericTable('active_clockins'),
  checklist: defineGenericTable('checklist'),
  payments: defineGenericTable('payments'),
  vos: defineGenericTable('vos'),
  quotations: defineGenericTable('quotations'),
  legacy_documents: defineGenericTable('legacy_documents'),
  policies: defineGenericTable('policies'),
  items: defineGenericTable('items'),
  clients: defineGenericTable('clients'),
  settings: defineGenericTable('settings'),
  
  media: sequelize.define('media', {
    id: { type: DataTypes.STRING, primaryKey: true },
    filename: DataTypes.STRING,
    mime_type: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
  }, { 
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }),
  
  projects: sequelize.define('projects', {
    id: { type: DataTypes.STRING, primaryKey: true },
    projectData: {
      type: DataTypes.TEXT,
      get() {
        const raw = this.getDataValue('projectData');
        try {
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          console.error('[Sequelize] Project data parse error:', e.message);
          return null;
        }
      },
      set(val) {
        this.setDataValue('projectData', JSON.stringify(val));
      }
    }
  }, { timestamps: true })
};

// Initialize Database
(async () => {
  try {
    // First initialize SQLite database with schema
    await initSQLiteDatabase();
    
    // Then authenticate with Sequelize
    await sequelize.authenticate();
    console.log('[Sequelize] Connection established successfully.');
    
    // Sync models with database (safe sync - won't drop existing data)
    await sequelize.sync({ alter: true });
    console.log('[Sequelize] Database synced successfully.');
    
    // Test connection with a simple query
    const testResult = await sequelize.query('SELECT 1 as test');
    console.log('[SQLite] Database test query successful:', testResult);
    
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    process.exit(1);
  }
})();

// --- API ROUTES (same as before, but with better error handling) ---

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'online', 
    mode: 'sqlite', 
    storage: dbPath,
    timestamp: new Date().toISOString()
  });
});

// Generic CRUD handlers with improved error handling
const standardTables = [
  'workers', 'invoices', 'transactions', 'attendance', 'leaves', 
  'payroll_runs', 'reminders', 'company_profiles', 'vouchers', 
  'milestones', 'crm_data', 'active_clockins', 'checklist', 
  'payments', 'vos', 'quotations', 'legacy_documents', 'policies', 'items', 'clients'
];

standardTables.forEach(tableName => {
  app.get(`/api/${tableName}`, async (req, res) => {
    try {
      const rows = await DB[tableName].findAll({ order: [['id', 'DESC']] });
      const data = rows.map(r => ({ ...r.data, id: r.data.id || r.id }));
      res.json(data);
    } catch (e) { 
      console.error(`[API GET ${tableName}] Error:`, e);
      res.status(500).json({ error: e.message, table: tableName });
    }
  });

  app.post(`/api/${tableName}`, async (req, res) => {
    try {
      if (Array.isArray(req.body)) {
        // Bulk Sync Mode
        await DB[tableName].destroy({ where: {}, truncate: true });
        if (req.body.length > 0) {
          await DB[tableName].bulkCreate(req.body.map(item => ({ data: item })));
        }
      } else {
        // Single Insert
        await DB[tableName].create({ data: req.body });
      }
      res.json({ success: true, count: Array.isArray(req.body) ? req.body.length : 1 });
    } catch (e) { 
      console.error(`[API POST ${tableName}] Error:`, e);
      res.status(500).json({ error: e.message, table: tableName });
    }
  });
});

// Projects Specific Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await DB.projects.findAll();
    res.json(projects.map(p => ({ ...p.projectData, id: p.id })));
  } catch (e) { 
    console.error('[API GET projects] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      // Bulk Sync
      await DB.projects.destroy({ where: {}, truncate: true });
      const records = req.body.map(p => ({ id: p.id, projectData: p }));
      if (records.length > 0) await DB.projects.bulkCreate(records);
    } else {
      // Single Upsert
      const { id, ...data } = req.body;
      const projectData = data.projectData || data;
      const projId = id || projectData.id;
      
      const exists = await DB.projects.findByPk(projId);
      if (exists) {
        await exists.update({ projectData });
      } else {
        await DB.projects.create({ id: projId, projectData });
      }
    }
    res.json({ success: true });
  } catch (e) { 
    console.error('[API POST projects] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await DB.projects.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { 
    console.error('[API DELETE projects] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Settings Route
app.get('/api/settings', async (req, res) => {
  try {
    const setting = await DB.settings.findOne({ order: [['id', 'DESC']] });
    res.json(setting ? setting.data : {});
  } catch (e) { 
    console.error('[API GET settings] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    await DB.settings.destroy({ where: {}, truncate: true });
    await DB.settings.create({ data: req.body });
    res.json({ success: true });
  } catch (e) { 
    console.error('[API POST settings] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Media Routes
app.get('/api/media', async (req, res) => {
  try {
    const media = await DB.media.findAll(); // Removed ORDER BY for now
    res.json(media);
  } catch (e) { 
    console.error('[API GET media] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/media', async (req, res) => {
  try {
    const { id, filename, mime_type } = req.body;
    await DB.media.create({ id, filename, mime_type });
    res.json({ success: true });
  } catch (e) { 
    console.error('[API POST media] Error:', e);
    res.status(500).json({ error: e.message });
  }
});

// File upload endpoint
app.post('/api/upload', (req, res) => {
  // Implementation for file uploads
  res.json({ message: 'Upload endpoint - implement as needed' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Crafted Habitat backend running on http://localhost:${PORT}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  console.log(`[Server] SQLite database: ${dbPath}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('[Server] Shutting down gracefully...');
  sequelize.close();
  process.exit(0);
});