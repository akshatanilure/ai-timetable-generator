const mongoose = require('mongoose');
const Teacher = require('../src/models/Teacher');

const normalizeName = (name) => {
  return name
    .toLowerCase()
    .replace(/^(dr|prof|mr|mrs|ms|asst)\s+/g, '') // remove titles
    .replace(/[\s\.\,\-\_]/g, ''); // remove spaces, dots, commas, hyphens, underscores
};

const completeDeletePatterns = [
  /anand.*vaidya/i,
  /shrinivasrao.*kulkarni/i,
  /smilesh.*patraw/i
];

const matchCompleteDelete = (name) => {
  return completeDeletePatterns.some(pattern => pattern.test(name));
};

mongoose.connect('mongodb://localhost:27017/ai-timetable-generator')
  .then(async () => {
    try {
      const allTeachers = await Teacher.find({});
      console.log(`Loaded ${allTeachers.length} teacher records from database.`);

      const toDeleteCompletely = [];
      const groups = {};

      allTeachers.forEach(t => {
        const name = t.name;
        if (matchCompleteDelete(name)) {
          toDeleteCompletely.push(t);
        } else {
          const norm = normalizeName(name);
          // Special merge mapping (e.g. merge 'upkulkarni' with 'umakantpkulkarni' if desired, or let it merge naturally)
          // Let's do some manual normalization mapping for the requested names:
          let key = norm;
          if (norm.includes('prathapkumarmk') || norm.includes('pratapkumarmk')) {
            key = 'pratapkumarmk';
          }
          if (norm.includes('raghavendrags')) {
            key = 'raghavendrags';
          }
          if (norm.includes('nitagkulkarni')) {
            key = 'nitagkulkarni';
          }
          if (norm.includes('bahubalikm')) {
            key = 'bahubalikm';
          }
          if (norm.includes('shradhahn') || norm.includes('sharadahn')) {
            key = 'sharadahn';
          }
          if (norm.includes('govindgnegalur') || norm.includes('govindnegalur')) {
            key = 'govindnegalur';
          }

          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(t);
        }
      });

      console.log('\n--- SCRIPT PLAN ---');
      console.log(`Teachers to delete completely (${toDeleteCompletely.length}):`);
      toDeleteCompletely.forEach(t => {
        console.log(` - DELETING COMPLETELY: "${t.name}" (${t.department}) - ID: ${t._id}`);
      });

      const duplicatesToDelete = [];
      const keptTeachers = [];

      Object.keys(groups).forEach(key => {
        const list = groups[key];
        if (list.length > 1) {
          console.log(`\nDuplicate Group for key "${key}" (${list.length} records):`);
          // Sort by which record has more fields or a cleaner name
          list.sort((a, b) => {
            // Prefer records that have a user reference or more subjects handled
            const scoreA = (a.user ? 10 : 0) + (a.subjectsHandled ? a.subjectsHandled.length : 0);
            const scoreB = (b.user ? 10 : 0) + (b.subjectsHandled ? b.subjectsHandled.length : 0);
            return scoreB - scoreA;
          });

          const keep = list[0];
          keptTeachers.push(keep);
          console.log(`   [KEEP]  "${keep.name}" (${keep.department}) - ID: ${keep._id}`);

          for (let i = 1; i < list.length; i++) {
            duplicatesToDelete.push(list[i]);
            console.log(`   [DELETE] "${list[i].name}" (${list[i].department}) - ID: ${list[i]._id}`);
          }
        } else {
          keptTeachers.push(list[0]);
        }
      });

      console.log('\n--- EXECUTING DELETIONS ---');
      
      // Perform complete deletions
      for (const t of toDeleteCompletely) {
        await Teacher.deleteOne({ _id: t._id });
        console.log(`Successfully deleted completely: "${t.name}"`);
      }

      // Perform duplicate deletions
      for (const t of duplicatesToDelete) {
        await Teacher.deleteOne({ _id: t._id });
        console.log(`Successfully deleted duplicate: "${t.name}"`);
      }

      console.log('\n--- DEDUPLICATION COMPLETE ---');
      const finalCount = await Teacher.countDocuments({});
      console.log(`Total teachers remaining in DB: ${finalCount}`);

    } catch (err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  })
  .catch(console.error);
