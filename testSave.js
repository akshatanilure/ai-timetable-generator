const axios = require('axios');

(async () => {
  try {
    // Generate a valid timetable first to get valid rawSchedules
    const genRes = await axios.post('http://localhost:5000/api/timetables/generate-ml', {
      semester: 1,
      branch: 'CSE',
      facultyMapping: {},
      divisions: [{name: 'DIV-A', strength: 60}],
      facultyMaxWorkloads: {},
      fixedTimings: {}
    }, {
      headers: {
        'Authorization': 'Bearer ' + (await getAdminToken())
      }
    });

    const rawSchedules = genRes.data.data.rawSchedules;

    // Try saving it
    const saveRes = await axios.post('http://localhost:5000/api/timetables/save-ml', {
      semester: 1,
      branch: 'CSE',
      rawSchedules
    }, {
      headers: {
        'Authorization': 'Bearer ' + (await getAdminToken())
      }
    });

    console.log("SUCCESS:", saveRes.data);
  } catch (err) {
    console.error("ERROR:");
    console.error(err.response ? err.response.data : err.message);
  }
})();

async function getAdminToken() {
  const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
    email: 'admin@example.com',
    password: 'password123'
  }).catch(() => null);
  
  if (loginRes) return loginRes.data.token;

  const regRes = await axios.post('http://localhost:5000/api/auth/register', {
    name: 'Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  });
  return regRes.data.token;
}
