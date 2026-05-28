const test = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    });
    const authData = await res.json();
    const token = authData.token;
    
    console.log('Got token:', token ? 'yes' : 'no');
    
    const subRes = await fetch('http://localhost:5000/api/subjects?semester=1&branch=CSE', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const subData = await subRes.json();
    const subjects = subData.data;
    
    const facRes = await fetch('http://localhost:5000/api/teachers', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const facData = await facRes.json();
    const faculties = facData.data;
    
    if (subjects.length === 0 || faculties.length === 0) {
      console.log('No subjects or faculties found');
      return;
    }

    const facultyMapping = {};
    for (const sub of subjects) {
       if (sub.subjectType === 'lab') {
         facultyMapping[sub._id] = [faculties[0]._id, faculties[1]._id];
       } else {
         facultyMapping[sub._id] = faculties[0]._id;
       }
    }
    
    console.log('Calling generate-ml...');
    const generateRes = await fetch('http://localhost:5000/api/timetables/generate-ml', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        semester: 1,
        branch: 'CSE',
        facultyMapping
      })
    });
    
    if (!generateRes.ok) {
      console.log('Error Status:', generateRes.status);
      console.log('Error Data:', await generateRes.text());
    } else {
      const generateData = await generateRes.json();
      console.log('Generate Response keys:', Object.keys(generateData));
      console.log('Data keys:', Object.keys(generateData.data));
    }
  } catch(e) {
    console.log('Error:', e.message);
  }
};
test();
