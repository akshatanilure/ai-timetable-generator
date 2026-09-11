const testSaveAndGet = async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'password123' })
    });
    const authData = await loginRes.json();
    const token = authData.token;

    // 1. Generate ML Timetable
    console.log('Generating ML Timetable for Sem 1...');
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
    console.log('Generation Status:', genData.success, genData.message);

    // 2. Save Timetable to DB
    console.log('Saving generated timetable to MongoDB...');
    const saveRes = await fetch('http://localhost:5000/api/timetables/save-ml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        semester: 1,
        branch: 'CSE',
        rawSchedules: genData.data.rawSchedules
      })
    });
    const saveData = await saveRes.json();
    console.log('Save Status:', saveData.success, 'Saved timetables count:', saveData.data?.length);

    const savedId = saveData.data[0]._id;

    // 3. Fetch Populated Timetable
    console.log('Fetching populated timetable from MongoDB...');
    const getRes = await fetch(`http://localhost:5000/api/timetables/${savedId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getData = await getRes.json();
    const timetable = getData.data;

    console.log('Populated Division:', timetable.division?.divisionName);
    console.log('Total Sessions in Schedule:', timetable.generatedSchedule?.length);

    // Inspect lab sessions
    const labSessions = timetable.generatedSchedule.filter(s => s.batch);
    console.log(`\nFound ${labSessions.length} lab sessions in populated schedule:`);
    
    labSessions.slice(0, 6).forEach((s, idx) => {
      console.log(`\n  Lab Session ${idx + 1}:`);
      console.log(`    - Day/Time: ${s.day} ${s.startTime}-${s.endTime}`);
      console.log(`    - Subject: ${s.subject?.subjectCode} (${s.subject?.subjectName})`);
      console.log(`    - Batch: ${s.batch?.batchName}`);
      console.log(`    - Faculty (${s.faculty?.length}):`, s.faculty?.map(f => f.name).join(', '));
      console.log(`    - Room:`, s.room?.roomNumber);
    });

  } catch (err) {
    console.error('Error:', err);
  }
};

testSaveAndGet();
