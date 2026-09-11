const testPrintAllLabs = async () => {
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
  const labEntries = rawSchedules.filter(s => s.batch && s.batch.batchName);
  
  console.log(`Found ${labEntries.length} lab entries in rawSchedules:`);
  labEntries.forEach((l, i) => {
    console.log(`\nLab ${i+1}: Subject: ${l.subject?.subjectCode || l.subject?.subjectName} | Batch: ${l.batch?.batchName} | Slot: ${l.day} ${l.startTime}-${l.endTime} | Faculty Count: ${l.faculty?.length}`);
    console.log('  Faculty:', l.faculty);
    console.log('  Room:', l.room);
  });
};

testPrintAllLabs();
