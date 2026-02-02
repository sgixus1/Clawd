import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
const MAX_PAYLOAD = '100mb';
app.use(express.json({ limit: MAX_PAYLOAD }));
app.use(express.urlencoded({ limit: MAX_PAYLOAD, extended: true }));

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const DATA_DIR = path.resolve(__dirname, 'data');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// --- SQLITE DATABASE SETUP ---
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(DATA_DIR, 'database.sqlite'),
  logging: false 
});

// Generic Model Generator
const defineGenericTable = (tableName) => {
  return sequelize.define(tableName, {
    data: {
      type: DataTypes.TEXT, // Storing JSON string
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('data');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('data', JSON.stringify(value));
      }
    }
  }, {
    timestamps: true
  });
};

// Define Models (Mapping to your original MySQL tables)
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
  // Media table needs specific schema
  media: sequelize.define('media', {
    id: { type: DataTypes.STRING, primaryKey: true },
    filename: DataTypes.STRING,
    mime_type: DataTypes.STRING
  }),
  // Projects table needs specific schema
  projects: sequelize.define('projects', {
    id: { type: DataTypes.STRING, primaryKey: true },
    projectData: {
      type: DataTypes.TEXT,
      get() {
        const raw = this.getDataValue('projectData');
        return raw ? JSON.parse(raw) : null;
      },
      set(val) {
        this.setDataValue('projectData', JSON.stringify(val));
      }
    }
  })
};

// Initialize DB
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Creates tables if missing
    console.log('[SQLite] Database synced successfully.');
  } catch (error) {
    console.error('[SQLite] Initialization failed:', error);
  }
})();

// --- API ROUTES ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'online', mode: 'sqlite', storage: path.join(DATA_DIR, 'database.sqlite') });
});

// Generic CRUD handlers
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
      const data = rows.map(r => ({ ...r.data, id: r.data.id || r.id })); // Merge SQL ID if missing in JSON
      res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post(`/api/${tableName}`, async (req, res) => {
    try {
      // For bulk replacement (how your app seems to work based on utils.ts), 
      // we might need to truncate and insert. 
      // BUT safely, let's just handle insert for now or check if it's an array.
      
      if (Array.isArray(req.body)) {
        // Full Sync Mode: Wipe and Replace (Heavy but consistent with your frontend logic)
        await DB[tableName].destroy({ where: {}, truncate: true });
        if (req.body.length > 0) {
           await DB[tableName].bulkCreate(req.body.map(item => ({ data: item })));
        }
      } else {
        // Single Insert
        await DB[tableName].create({ data: req.body });
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });
});

// Projects Specific Routes
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await DB.projects.findAll();
    res.json(projects.map(p => ({ ...p.projectData, id: p.id })));
  } catch (e) { res.status(500).json({ error: e.message }); }
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
       const projectData = data.projectData || data; // Handle wrapper if present
       const projId = id || projectData.id;
       
       const exists = await DB.projects.findByPk(projId);
       if (exists) {
         await exists.update({ projectData });
       } else {
         await DB.projects.create({ id: projId, projectData });
       }
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await DB.projects.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Settings Route
app.get('/api/settings', async (req, res) => {
  try {
    const setting = await DB.settings.findOne({ order: [['id', 'DESC']] });
    res.json(setting ? setting.data : {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/settings', async (req, res) => {
  try {
    await DB.settings.destroy({ where: {}, truncate: true }); // Keep only latest
    await DB.settings.create({ data: req.body });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Media Routes
app.post('/api/media', async (req, res) => {
  try {
    const { id, data, mimeType } = req.body;
    const base64Data = data.split(';base64,').pop();
    const extension = mimeType?.split('/')[1] || 'bin';
    const filename = `${id}.${extension}`;
    
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), base64Data, { encoding: 'base64' });
    
    const exists = await DB.media.findByPk(id);
    if (exists) {
      await exists.update({ filename, mime_type: mimeType });
    } else {
      await DB.media.create({ id, filename, mime_type: mimeType });
    }
    
    res.json({ success: true, url: `/api/media/view/${id}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/media/view/:id', async (req, res) => {
  try {
    const media = await DB.media.findByPk(req.params.id);
    if (media) {
      res.setHeader('Content-Type', media.mime_type);
      res.sendFile(path.join(UPLOADS_DIR, media.filename));
    } else {
      res.status(404).send('Not found');
    }
  } catch (e) { res.status(500).send('Error'); }
});

// Static Files
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  if (req.url.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.send('API Server Online. Frontend build not found.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] SQLite Backend running on port ${PORT}`);
});
