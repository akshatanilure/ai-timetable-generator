const testPrintKeys = async () => {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@college.edu', password: 'password123' })
  });
  const authData = await loginRes.json();
  const token = authData.token;

  const genRes = await fetch('http://localhost:5000/api/timetables/generate-ml', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      semester: 1,
      branch: 'CSE',
      divisions: [{ name: 'DIV-A', strength: 72 }],
      labsConfig: [{ id: 1, name: 'Lab 1', capacity: 30 }, { id: 2, name: 'Lab 2', capacity: 30 }, { id: 3, name: 'Lab 3', capacity: 30 }]
    })
  });

  const genData = await genRes.json();
  const rawSchedules = genData.data.rawSchedules['DIV-A'] || [];
  const labSessions = rawSchedules.filter(s => s.batch && s.batch.batchName);
  
  console.log('FIRST LAB SESSION:', labSessions[0]);
};

testPrintKeys();
