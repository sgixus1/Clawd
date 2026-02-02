# Crafted Habitat - SQLite Fixes

## Issues Fixed

### 1. **SQLite Database Initialization**
- **Problem**: Original schema.sql used MySQL syntax (`ENGINE=InnoDB`, `AUTO_INCREMENT`)
- **Solution**: Created `schema-sqlite.sql` with proper SQLite syntax (`AUTOINCREMENT`, no engine spec)
- **Impact**: Database tables now create correctly on SQLite

### 2. **Sequelize Sync Issues**
- **Problem**: Sequelize might fail to create tables if schema mismatch
- **Solution**: Added direct SQLite initialization before Sequelize sync
- **Impact**: Guaranteed table creation with proper schema

### 3. **Error Handling**
- **Problem**: Minimal error logging made debugging difficult
- **Solution**: Enhanced error handling with table names and detailed logs
- **Impact**: Easier debugging when API calls fail

### 4. **CORS Configuration**
- **Problem**: Potential CORS issues with frontend
- **Solution**: Explicit CORS origins configuration
- **Impact**: Frontend can connect to backend reliably

### 5. **Startup Script**
- **Problem**: Complex startup process
- **Solution**: Single `start-fixed.bat` script
- **Impact**: One-click startup for development

## Files Created/Modified

### New Files:
1. `server-fixed.js` - Enhanced server with proper SQLite initialization
2. `schema-sqlite.sql` - SQLite-compatible schema
3. `start-fixed.bat` - Simplified startup script
4. `README-FIXES.md` - This documentation

### Modified Understanding:
- Original `server.js` uses Sequelize ORM with SQLite
- Frontend expects API endpoints at `/api/*`
- Data stored as JSON in `data` field (generic table approach)

## How to Use Fixed Version

### Option 1: Quick Start (Windows)
```bash
start-fixed.bat
```

### Option 2: Manual Start
```bash
# Install dependencies (if not already)
npm install

# Create directories
mkdir -p data uploads

# Start backend
node server-fixed.js

# In another terminal, start frontend
npm run dev
```

### Option 3: Production Build
```bash
npm run build
node server-fixed.js
```

## API Endpoints

- `GET /api/health` - Server status
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create/update projects
- `GET /api/{table}` - List records for any table
- `POST /api/{table}` - Create/update records

## Database Location
- SQLite file: `data/database.sqlite`
- Uploads: `uploads/` directory

## Troubleshooting

### 1. "Cannot find module" errors
```bash
npm install
```

### 2. Port already in use
Edit `server-fixed.js` line 12 to change PORT:
```javascript
const PORT = process.env.PORT || 5001;  # Change from 5000
```

### 3. Database connection errors
- Check if `data/` directory exists
- Check file permissions for `data/database.sqlite`
- Delete `data/database.sqlite` to force fresh initialization

### 4. Frontend not connecting
- Ensure backend is running on correct port
- Check browser console for CORS errors
- Verify `API_BASE` in `utils.ts` matches backend port

## Next Steps for Further Improvements

1. **Add database migrations** for schema changes
2. **Implement backup/restore** functionality
3. **Add user authentication** if needed
4. **Optimize JSON storage** for large datasets
5. **Add import/export** features

## Notes
- The app uses a generic table approach where each table has a `data` TEXT column storing JSON
- This allows flexible schema without rigid table structures
- Trade-off: Limited SQL query capabilities on JSON fields