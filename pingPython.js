fetch('http://127.0.0.1:8000/api/ml/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subjects: [{"_id": "1", "lectureHours": 1}],
    teachers: [{"_id": "1"}],
    rooms: [{"_id": "1"}],
    constraints: {},
    facultyMapping: {},
    divisions: [{"name": "DIV-A", "strength": 60}],
    facultyMaxWorkloads: {},
    fixedTimings: {}
  })
}).then(async res => {
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}).catch(err => {
  console.log("Fetch failed:", err.message);
});
