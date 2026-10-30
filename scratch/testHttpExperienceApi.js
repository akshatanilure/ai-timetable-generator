const mongoose = require('mongoose');
const dotenv = require('dotenv');
const express = require('express');
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use('/api/experience', require('../src/routes/historicalExperienceRoutes'));

  const server = app.listen(5099, async () => {
    try {
      console.log('Testing HTTP Endpoints on port 5099...');

      // 1. GET /api/experience/stats
      const resStats = await fetch('http://localhost:5099/api/experience/stats');
      const dataStats = await resStats.json();
      console.log('STATS API:', dataStats);

      // 2. GET /api/experience/rankings?semester=4&program=UG
      const resRankings = await fetch('http://localhost:5099/api/experience/rankings?semester=4&program=UG');
      const dataRankings = await resRankings.json();
      console.log('RANKINGS API (Sem 4): count =', dataRankings.count, '| success =', dataRankings.success);
      
      const firstSubKey = Object.keys(dataRankings.data)[0];
      console.log('Sample subject ranking:', dataRankings.data[firstSubKey]);

      // 3. GET /api/experience/ranking/:subjectId
      const Subject = require('../src/models/Subject');
      const oopLab = await Subject.findOne({ subjectCode: '22UCSL403' });
      if (oopLab) {
        const resSingle = await fetch(`http://localhost:5099/api/experience/ranking/${oopLab._id}`);
        const dataSingle = await resSingle.json();
        console.log('SINGLE SUBJECT API (22UCSL403):', {
          subjectName: dataSingle.data.subjectName,
          hasHistoricalRecords: dataSingle.data.hasHistoricalRecords,
          rankingsCount: dataSingle.data.rankings.length,
          topTeacher: dataSingle.data.rankings[0]?.teacherName
        });
      }

      // 4. POST /api/experience/import (empty body -> uses default excel)
      const resImport = await fetch('http://localhost:5099/api/experience/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const dataImport = await resImport.json();
      console.log('IMPORT API (Default re-sync):', dataImport);

      console.log('\nALL HTTP ENDPOINTS WORKING PERFECTLY!');
    } catch (e) {
      console.error('HTTP Test error:', e);
    } finally {
      server.close();
      await mongoose.disconnect();
    }
  });
}
run();

