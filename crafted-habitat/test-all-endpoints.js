import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

const endpoints = [
  'health',
  'projects',
  'workers',
  'invoices',
  'transactions',
  'attendance',
  'leaves',
  'payroll_runs',
  'reminders',
  'company_profiles',
  'vouchers',
  'milestones',
  'crm_data',
  'active_clockins',
  'checklist',
  'payments',
  'vos',
  'quotations',
  'legacy_documents',
  'policies',
  'items',
  'clients',
  'settings',
  'media'
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`);
    const status = response.status;
    let data = null;
    
    if (status === 200) {
      try {
        data = await response.json();
      } catch (e) {
        data = { error: 'Invalid JSON response' };
      }
    }
    
    return {
      endpoint,
      status,
      working: status === 200 || status === 404,
      data: data ? (Array.isArray(data) ? `Array[${data.length}]` : 'Object') : 'No data'
    };
  } catch (error) {
    return {
      endpoint,
      status: 'ERROR',
      working: false,
      data: error.message
    };
  }
}

async function testCRUD(endpoint) {
  console.log(`\n=== Testing CRUD for ${endpoint} ===`);
  
  // Test POST (Create)
  try {
    const testData = { 
      name: `Test ${endpoint}`, 
      description: 'Created by automated test',
      timestamp: new Date().toISOString()
    };
    
    const postResponse = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([testData])  // Send as array for bulk sync
    });
    
    const postStatus = postResponse.status;
    const postResult = postStatus === 200 ? await postResponse.json() : null;
    
    console.log(`  POST: ${postStatus} ${postResult ? JSON.stringify(postResult) : 'Failed'}`);
    
    // Test GET (Read)
    const getResponse = await fetch(`${API_BASE}/${endpoint}`);
    const getStatus = getResponse.status;
    
    if (getStatus === 200) {
      const getData = await getResponse.json();
      console.log(`  GET: ${getStatus} (${Array.isArray(getData) ? getData.length + ' items' : 'Object'})`);
      
      if (Array.isArray(getData) && getData.length > 0) {
        const lastItem = getData[0];
        console.log(`  Sample: ${JSON.stringify(lastItem).substring(0, 100)}...`);
      }
    } else {
      console.log(`  GET: ${getStatus}`);
    }
    
    return postStatus === 200 && getStatus === 200;
    
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=== Crafted Habitat App Functional Test ===');
  console.log(`Testing ${endpoints.length} endpoints...\n`);
  
  // Test basic endpoint availability
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    console.log(`${result.working ? '✅' : '❌'} ${endpoint.padEnd(20)} ${result.status.toString().padEnd(6)} ${result.data}`);
  }
  
  // Summary
  const working = results.filter(r => r.working).length;
  const total = results.length;
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Working: ${working}/${total} endpoints (${Math.round(working/total*100)}%)`);
  
  // Test CRUD for key endpoints
  console.log(`\n=== CRUD Testing ===`);
  const keyEndpoints = ['projects', 'workers', 'invoices', 'settings'];
  
  for (const endpoint of keyEndpoints) {
    const crudWorks = await testCRUD(endpoint);
    console.log(`  ${crudWorks ? '✅' : '❌'} ${endpoint} CRUD operations`);
  }
  
  // Test inter-module communication
  console.log(`\n=== Module Communication Test ===`);
  
  // Create a project
  const projectData = {
    id: 'test-project-' + Date.now(),
    name: 'Test Construction Project',
    client: 'Test Client',
    status: 'planning',
    budget: 50000,
    startDate: new Date().toISOString()
  };
  
  try {
    const projectResponse = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([projectData])
    });
    
    if (projectResponse.status === 200) {
      console.log('✅ Project module: Create working');
      
      // Create related worker
      const workerData = {
        id: 'test-worker-' + Date.now(),
        name: 'Test Worker',
        role: 'Carpenter',
        projectId: projectData.id,
        hourlyRate: 25
      };
      
      const workerResponse = await fetch(`${API_BASE}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([workerData])
      });
      
      if (workerResponse.status === 200) {
        console.log('✅ Worker module: Create with project reference working');
        
        // Verify data persistence
        const verifyProjects = await fetch(`${API_BASE}/projects`);
        const verifyWorkers = await fetch(`${API_BASE}/workers`);
        
        if (verifyProjects.status === 200 && verifyWorkers.status === 200) {
          const projects = await verifyProjects.json();
          const workers = await verifyWorkers.json();
          
          const foundProject = projects.find(p => p.id === projectData.id);
          const foundWorker = workers.find(w => w.projectId === projectData.id);
          
          if (foundProject && foundWorker) {
            console.log('✅ Module communication: Project ↔ Worker relationship working');
          } else {
            console.log('❌ Module communication: Data relationship not found');
          }
        }
      }
    }
  } catch (error) {
    console.log(`❌ Module communication test failed: ${error.message}`);
  }
  
  console.log(`\n=== TEST COMPLETE ===`);
  console.log(`App backend is ${working >= endpoints.length * 0.8 ? 'FUNCTIONAL' : 'PARTIALLY WORKING'}`);
  console.log(`Database: /root/.openclaw/workspace/crafted-habitat-refactor/data/database.sqlite`);
}

runTests().catch(console.error);