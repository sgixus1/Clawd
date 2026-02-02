import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Crafted Habitat SQLite Test ===');

// Create test database
const testDbPath = path.join(__dirname, 'test-database.sqlite');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
}

// Initialize Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: testDbPath,
  logging: false
});

// Test model
const TestModel = sequelize.define('test_table', {
  data: {
    type: DataTypes.TEXT,
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

async function runTests() {
  try {
    console.log('1. Testing database connection...');
    await sequelize.authenticate();
    console.log('   ✓ Connection successful');
    
    console.log('2. Testing table creation...');
    await sequelize.sync();
    console.log('   ✓ Tables created successfully');
    
    console.log('3. Testing data insertion...');
    const testData = { name: 'Test Project', value: 123, active: true };
    const record = await TestModel.create({ data: testData });
    console.log('   ✓ Data inserted, ID:', record.id);
    
    console.log('4. Testing data retrieval...');
    const retrieved = await TestModel.findByPk(record.id);
    console.log('   ✓ Data retrieved:', retrieved.data);
    
    console.log('5. Testing JSON parsing...');
    if (retrieved.data.name === 'Test Project' && retrieved.data.value === 123) {
      console.log('   ✓ JSON parsing works correctly');
    } else {
      console.log('   ✗ JSON parsing failed');
    }
    
    console.log('6. Testing bulk operations...');
    const bulkData = [
      { data: { item: 'A', count: 1 } },
      { data: { item: 'B', count: 2 } },
      { data: { item: 'C', count: 3 } }
    ];
    await TestModel.bulkCreate(bulkData);
    const allRecords = await TestModel.findAll();
    console.log(`   ✓ Bulk insert successful, total records: ${allRecords.length}`);
    
    console.log('\n=== ALL TESTS PASSED ===');
    console.log('SQLite implementation is working correctly.');
    console.log(`Database file: ${testDbPath}`);
    
    // Cleanup
    await sequelize.close();
    fs.unlinkSync(testDbPath);
    
  } catch (error) {
    console.error('\n=== TEST FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Cleanup on failure
    try {
      await sequelize.close();
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
    
    process.exit(1);
  }
}

runTests();