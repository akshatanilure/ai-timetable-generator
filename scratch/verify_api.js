const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: '60c72b2f9b1d8b2bad84e912' }, 'supersecretkey123');

function fetch(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 5000,
      path,
      headers: { 'Authorization': 'Bearer ' + token }
    };
    http.get(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function verify() {
  console.log('=== VERIFYING SUBJECTS VIA BACKEND API ===');
  
  const ugRes = await fetch('/api/subjects?program=UG');
  console.log('UG Subjects count:', ugRes.count);

  const pgS1Res = await fetch('/api/subjects?program=PG&semester=1');
  console.log('\nPG Sem 1 count:', pgS1Res.count);
  console.log(pgS1Res.data.map(s => `[${s.subjectCode}] ${s.subjectName} | Cr: ${s.credits} | L-T-P: ${s.lectureHours}-${s.tutorialHours}-${s.practicalHours} | Type: ${s.subjectType} | Dept: ${s.department}`));

  const pgS2Res = await fetch('/api/subjects?program=PG&semester=2');
  console.log('\nPG Sem 2 count (must be unchanged):', pgS2Res.count);

  const pgS3Res = await fetch('/api/subjects?program=PG&semester=3');
  console.log('\nPG Sem 3 count:', pgS3Res.count);
  console.log(pgS3Res.data.map(s => `[${s.subjectCode}] ${s.subjectName} | Cr: ${s.credits} | L-T-P: ${s.lectureHours}-${s.tutorialHours}-${s.practicalHours} | Type: ${s.subjectType} | Dept: ${s.department}`));

  const pgS4Res = await fetch('/api/subjects?program=PG&semester=4');
  console.log('\nPG Sem 4 count (must be unchanged):', pgS4Res.count);
}

verify().catch(console.error);
