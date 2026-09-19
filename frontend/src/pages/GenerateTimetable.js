import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FiCpu, FiAlertCircle, FiCheckCircle, FiZap, FiSettings, 
  FiRefreshCw, FiActivity, FiUsers, FiClock,
  FiBookOpen, FiList, FiDownload
} from 'react-icons/fi';
import Select from 'react-select';
import html2pdf from 'html2pdf.js';

const GenerateTimetable = () => {
  const [cycle, setCycle] = useState('odd'); // 'odd' (1, 3, 5, 7) or 'even' (2, 4, 6)
  const [genMode, setGenMode] = useState('priority'); // 'priority' (Sem 1/2) or 'grouped' (3,5,7 or 4,6)
  const [allFacultyMappings, setAllFacultyMappings] = useState({});
  const [allFixedTimings, setAllFixedTimings] = useState({});

  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    semester: 1,
    branch: 'CSE'
  });
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [facultyMapping, setFacultyMapping] = useState({});
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [numDivisions, setNumDivisions] = useState(1);
  const [divisions, setDivisions] = useState([{ name: 'DIV-A', strength: 60 }]);
  const [specialRoles, setSpecialRoles] = useState({ hod: '', deans: [''], mic: '', naac: '' });
  const [numDeans, setNumDeans] = useState(1);
  
  const [fixedTimings, setFixedTimings] = useState({});
  const [peCredits, setPeCredits] = useState(3);
  const [oeCredits, setOeCredits] = useState(3);
  const [selectedFixSub, setSelectedFixSub] = useState('');
  const [selectedFixDay, setSelectedFixDay] = useState('');
  const [selectedFixTime, setSelectedFixTime] = useState('');
  const [selectedFixDiv, setSelectedFixDiv] = useState('ALL');

  // Multiple view options
  const [activeTab, setActiveTab] = useState('division');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const [allDivisions, setAllDivisions] = useState({});
  const [allSubjects, setAllSubjects] = useState({});
  const [savedSemesters, setSavedSemesters] = useState({});
  const [bySemesterResults, setBySemesterResults] = useState({});
  const [previewSemester, setPreviewSemester] = useState(1);

  const handleNumDeansChange = (val) => {
    let count = parseInt(val);
    if (isNaN(count) || count < 0) count = 0;
    if (count > 10) count = 10;
    setNumDeans(count);
    setSpecialRoles(prev => {
      const currentDeans = prev.deans || [];
      const newDeans = [];
      for (let i = 0; i < count; i++) {
        newDeans.push(currentDeans[i] || '');
      }
      return { ...prev, deans: newDeans };
    });
  };

  const handleDeanSelect = (index, value) => {
    setSpecialRoles(prev => {
      const currentDeans = [...(prev.deans || [])];
      currentDeans[index] = value;
      return { ...prev, deans: currentDeans };
    });
  };

  const handleCycleChange = (newCycle) => {
    setCycle(newCycle);
    setGenMode('priority');
    const prioritySem = newCycle === 'odd' ? 1 : 2;
    setConfig(prev => ({ ...prev, semester: prioritySem }));
    setPreviewSemester(prioritySem);
  };

  const handleModeChange = (newMode) => {
    setGenMode(newMode);
    if (newMode === 'priority') {
      const prioritySem = cycle === 'odd' ? 1 : 2;
      setConfig(prev => ({ ...prev, semester: prioritySem }));
      setPreviewSemester(prioritySem);
    } else {
      const groupedDefaultSem = cycle === 'odd' ? 3 : 4;
      setConfig(prev => ({ ...prev, semester: groupedDefaultSem }));
      setPreviewSemester(groupedDefaultSem);
    }
  };

  const handleSelectSemester = (semNum) => {
    const currentSem = config.semester;
    if (currentSem) {
      setAllFacultyMappings(prev => ({ ...prev, [currentSem]: facultyMapping }));
      setAllDivisions(prev => ({ ...prev, [currentSem]: divisions }));
      setAllFixedTimings(prev => ({ ...prev, [currentSem]: fixedTimings }));
      setAllSubjects(prev => ({ ...prev, [currentSem]: subjects }));
    }

    setConfig(prev => ({ ...prev, semester: semNum }));

    if (allDivisions[semNum]) {
      setDivisions(allDivisions[semNum]);
      setNumDivisions(allDivisions[semNum].length);
    } else {
      setDivisions([{ name: 'DIV-A', strength: 60 }]);
      setNumDivisions(1);
    }
    if (allFacultyMappings[semNum]) {
      setFacultyMapping(allFacultyMappings[semNum]);
    }
    if (allFixedTimings[semNum]) {
      setFixedTimings(allFixedTimings[semNum]);
    }
  };

  const handleSaveSemesterInputs = (semNum) => {
    const s = semNum || config.semester;
    setAllDivisions(prev => ({ ...prev, [s]: divisions }));
    setAllFacultyMappings(prev => ({ ...prev, [s]: facultyMapping }));
    setAllFixedTimings(prev => ({ ...prev, [s]: fixedTimings }));
    setAllSubjects(prev => ({ ...prev, [s]: subjects }));
    setSavedSemesters(prev => ({ ...prev, [s]: true }));
    alert(`Semester ${s} inputs saved successfully!`);
  };

  const handleEditSemesterInputs = (semNum) => {
    const s = semNum || config.semester;
    setSavedSemesters(prev => ({ ...prev, [s]: false }));
  };

  useEffect(() => {
    if (config.semester) {
      setAllFacultyMappings(prev => ({
        ...prev,
        [config.semester]: facultyMapping
      }));
    }
  }, [facultyMapping, config.semester]);

  useEffect(() => {
    if (config.semester) {
      setAllFixedTimings(prev => ({
        ...prev,
        [config.semester]: fixedTimings
      }));
    }
  }, [fixedTimings, config.semester]);

  useEffect(() => {
    fetchFaculties();
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data.data);
      if (res.data.data.length > 0) {
        setSelectedRoomId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching rooms', err);
    }
  };

  useEffect(() => {
    if (config.semester && config.branch) {
      fetchSubjects();
      fetchFaculties();
    }
  }, [config.semester, config.branch]);

  const fetchFaculties = async () => {
    try {
      const res = await api.get(`/teachers?semester=${config.semester}`);
      setFaculties(res.data.data);
    } catch (err) {
      console.error('Error fetching faculties', err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get(`/subjects?semester=${config.semester}&branch=${config.branch}`);
      setSubjects(res.data.data);
      
      const peSub = res.data.data.find(s => (s.subjectCode || '').includes('UCSE') || (s.subjectName || '').toLowerCase().includes('program') || (s.subjectName || '').toLowerCase().includes('elective') || s.subjectType === 'elective');
      if (peSub) setPeCredits(peSub.lectureHours || peSub.credits || 3);

      const oeSub = res.data.data.find(s => (s.subjectCode || '').includes('UCSO') || (s.subjectName || '').toLowerCase().includes('open'));
      if (oeSub) setOeCredits(oeSub.lectureHours || oeSub.credits || 3);

      // Initialize mapping
      const initialMap = {};
      res.data.data.forEach(sub => {
        initialMap[sub._id] = {
          theory: '',
          lab: []
        };
      });
      setFacultyMapping(initialMap);
      setResult(null);
    } catch (err) {
      console.error('Error fetching subjects', err);
    }
  };

  const calculateDynamicWorkloadsFrom = (mapping) => {
    const workloads = {};
    divisions.forEach(div => {
      const divMap = mapping[div.name] || {};
      subjects.forEach(sub => {
        const map = divMap[sub._id];
        if (!map) return;
        
        const theoryHours = (sub.lectureHours || 0) + (sub.tutorialHours || 0);
        const labHours = sub.practicalHours || 0;
        
        if (map.theory) {
          workloads[map.theory] = (workloads[map.theory] || 0) + theoryHours;
        }
        if (map.lab && map.lab[0]) {
          workloads[map.lab[0]] = (workloads[map.lab[0]] || 0) + labHours;
        }
        if (map.lab && map.lab[1]) {
          workloads[map.lab[1]] = (workloads[map.lab[1]] || 0) + labHours;
        }
      });
    });
    return workloads;
  };

  const handleTheorySelect = (divName, subjectId, teacherId) => {
    if (teacherId) {
      const tempMapping = { 
        ...facultyMapping, 
        [divName]: { 
           ...(facultyMapping[divName] || {}), 
           [subjectId]: { ...((facultyMapping[divName] || {})[subjectId] || {}), theory: teacherId } 
        } 
      };
      const tempWorkloads = calculateDynamicWorkloadsFrom(tempMapping);
      const teacher = faculties.find(f => f._id === teacherId);
      const totalRequested = (teacher.currentWorkload || 0) + tempWorkloads[teacherId];
      const maxAllowed = getFacultyMaxWorkload(teacherId);
      
      if (totalRequested > maxAllowed) {
        const remaining = maxAllowed - (teacher.currentWorkload || 0) - ((calculateDynamicWorkloadsFrom(facultyMapping)[teacherId])||0);
        alert(`Cannot assign ${teacher.name}! Their working hours would be exceeded.\nThey only have ${remaining} hours remaining based on their Role.`);
        return;
      }
    }
    
    setFacultyMapping(prev => ({
      ...prev,
      [divName]: {
        ...(prev[divName] || {}),
        [subjectId]: { ...((prev[divName] || {})[subjectId] || {}), theory: teacherId }
      }
    }));
  };

  const handleLabSelect = (divName, subjectId, teacherId, index) => {
    if (teacherId) {
      const currentLab = (facultyMapping[divName]?.[subjectId]?.lab) || ['', ''];
      const newLab = [...currentLab];
      newLab[index] = teacherId;
      
      const tempMapping = { 
        ...facultyMapping, 
        [divName]: { 
           ...(facultyMapping[divName] || {}), 
           [subjectId]: { ...((facultyMapping[divName] || {})[subjectId] || {}), lab: newLab } 
        } 
      };
      
      const tempWorkloads = calculateDynamicWorkloadsFrom(tempMapping);
      const teacher = faculties.find(f => f._id === teacherId);
      const totalRequested = (teacher.currentWorkload || 0) + tempWorkloads[teacherId];
      const maxAllowed = getFacultyMaxWorkload(teacherId);
      
      if (totalRequested > maxAllowed) {
        const remaining = maxAllowed - (teacher.currentWorkload || 0) - ((calculateDynamicWorkloadsFrom(facultyMapping)[teacherId])||0);
        alert(`Cannot assign ${teacher.name}! Their working hours would be exceeded.\nThey only have ${remaining} hours remaining based on their Role.`);
        return;
      }
    }

    setFacultyMapping(prev => {
      const currentLab = (prev[divName]?.[subjectId]?.lab) || ['', ''];
      const newLab = [...currentLab];
      newLab[index] = teacherId;
      return {
        ...prev,
        [divName]: {
           ...(prev[divName] || {}),
           [subjectId]: { ...((prev[divName] || {})[subjectId] || {}), lab: newLab }
        }
      };
    });
  };

  const getLTP = (sub) => {
    return `${sub.lectureHours || 0}-${sub.tutorialHours || 0}-${sub.practicalHours || 0}`;
  };

  const getHours = (sub) => {
    return (sub.lectureHours || 0) + (sub.tutorialHours || 0) + (sub.practicalHours || 0);
  };

  const hasTheory = (sub) => (sub.lectureHours || 0) > 0 || (sub.tutorialHours || 0) > 0;
  const hasLab = (sub) => (sub.practicalHours || 0) > 0;

  const handleNumDivisionsChange = (e) => {
    let num = parseInt(e.target.value) || 1;
    if (num < 1) num = 1;
    if (num > 10) num = 10;
    setNumDivisions(num);
    
    const newDivs = [];
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < num; i++) {
      newDivs.push({ name: `DIV-${alphabet[i]}`, strength: divisions[i]?.strength || 60 });
    }
    setDivisions(newDivs);
  };

  const handleStrengthChange = (index, val) => {
    const newDivs = [...divisions];
    newDivs[index].strength = parseInt(val) || 0;
    setDivisions(newDivs);
  };

  const handleFixedTimingChange = (divName, subjectId, index, field, value) => {
    setFixedTimings(prev => {
      const updated = { ...prev };
      if (!updated[divName]) updated[divName] = {};
      const current = updated[divName][subjectId] || [];
      const newArr = [...current];
      if (!newArr[index]) newArr[index] = { day: '', time: '' };
      newArr[index] = { ...newArr[index], [field]: value };
      updated[divName][subjectId] = newArr;
      return updated;
    });
  };

  const handleElectiveCreditsChange = (electiveType, creditsVal) => {
    const validCredits = Math.max(1, Math.min(10, creditsVal || 1));
    if (electiveType === 'pe') setPeCredits(validCredits);
    if (electiveType === 'oe') setOeCredits(validCredits);

    setSubjects(prev => prev.map(sub => {
      const code = (sub.subjectCode || '').toUpperCase();
      const name = (sub.subjectName || '').toLowerCase();
      let matches = false;
      if (electiveType === 'pe') {
        matches = code.includes('UCSE') || name.includes('program elective') || name.includes('pe') || sub.subjectType === 'elective';
      }
      if (electiveType === 'oe') {
        matches = code.includes('UCSO') || name.includes('open elective') || name.includes('oe');
      }
      if (matches) {
        return { ...sub, lectureHours: validCredits };
      }
      return sub;
    }));
  };

  const handleGlobalElectiveTimingChange = (electiveType, index, field, value) => {
    setFixedTimings(prev => {
      const updated = { ...prev };
      const targetSubs = subjects.filter(s => {
        const code = (s.subjectCode || '').toUpperCase();
        const name = (s.subjectName || '').toLowerCase();
        if (electiveType === 'pe') {
          return code.includes('UCSE') || name.includes('program elective') || name.includes('pe') || s.subjectType === 'elective';
        }
        if (electiveType === 'oe') {
          return code.includes('UCSO') || name.includes('open elective') || name.includes('oe');
        }
        return false;
      });

      divisions.forEach(div => {
        if (!updated[div.name]) updated[div.name] = {};
        targetSubs.forEach(sub => {
          const current = updated[div.name][sub._id] || [];
          const newArr = [...current];
          if (!newArr[index]) newArr[index] = { day: '', time: '' };
          newArr[index] = { ...newArr[index], [field]: value };
          updated[div.name][sub._id] = newArr;
        });
      });
      return updated;
    });
  };

  const addFixedTiming = () => {
    if (!selectedFixSub || !selectedFixDay || !selectedFixTime) return;
    setFixedTimings(prev => {
      const updated = { ...prev };
      const targetDivs = selectedFixDiv === 'ALL' || !selectedFixDiv ? divisions.map(d => d.name) : [selectedFixDiv];
      targetDivs.forEach(divName => {
        if (!updated[divName]) updated[divName] = {};
        const current = updated[divName][selectedFixSub] || [];
        updated[divName][selectedFixSub] = [...current, { day: selectedFixDay, time: selectedFixTime }];
      });
      return updated;
    });
    setSelectedFixSub('');
    setSelectedFixDay('');
    setSelectedFixTime('');
  };

  const handleGenerate = async () => {
    if (genMode === 'grouped') {
      const semsToGenerate = cycle === 'odd' ? [3, 5, 7] : [4, 6];
      const unsaved = semsToGenerate.filter(s => !savedSemesters[s]);
      if (unsaved.length > 0) {
        alert(`Please save inputs semester by semester before generating.\nUnsaved semesters: ${unsaved.map(s => `Semester ${s}`).join(', ')}`);
        return;
      }
    }

    setLoading(true);
    setProgress(10);
    setResult(null);
    
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 500);

    try {
      setProgress(20);

      const facultyMaxWorkloads = {};
      faculties.forEach(f => facultyMaxWorkloads[f._id] = getFacultyMaxWorkload(f._id));

      if (genMode === 'priority') {
        const prioritySem = cycle === 'odd' ? 1 : 2;
        const semDivs = allDivisions[prioritySem] || divisions;
        const semMapping = allFacultyMappings[prioritySem] || facultyMapping;
        const semFixed = allFixedTimings[prioritySem] || fixedTimings;

        const res = await api.post('/timetables/generate-ml', {
          branch: config.branch,
          semester: prioritySem,
          facultyMapping: semMapping,
          divisions: semDivs,
          facultyMaxWorkloads,
          fixedTimings: semFixed
        });

        // Automatically save Priority Timetable to DB to lock workloads and rooms
        await api.post('/timetables/save-ml', {
          semester: prioritySem,
          branch: config.branch,
          rawSchedules: res.data.data.rawSchedules
        });

        setProgress(100);
        setResult(res.data);
        setBySemesterResults({
          [prioritySem]: res.data.data
        });
        setPreviewSemester(prioritySem);
        setShowPreview(true);
        alert(`Priority ${prioritySem}${prioritySem === 1 ? 'st' : 'nd'} Semester Timetable generated & saved successfully! Workloads and rooms are now locked for this priority semester.`);
      } else {
        // Grouped Generation (3, 5, 7 for Odd cycle; 4, 6 for Even cycle)
        const semsToGenerate = cycle === 'odd' ? [3, 5, 7] : [4, 6];
        const combinedMatrix = {};
        const combinedRawSchedules = {};
        const newBySemesterResults = {};
        let lastMessage = '';

        for (let i = 0; i < semsToGenerate.length; i++) {
          const semNum = semsToGenerate[i];
          setProgress(30 + Math.floor((i / semsToGenerate.length) * 60));

          const semDivs = allDivisions[semNum] || divisions;
          const semMapping = allFacultyMappings[semNum] || facultyMapping;
          const semFixed = allFixedTimings[semNum] || fixedTimings;

          const res = await api.post('/timetables/generate-ml', {
            branch: config.branch,
            semester: semNum,
            facultyMapping: semMapping,
            divisions: semDivs,
            facultyMaxWorkloads,
            fixedTimings: semFixed
          });

          // Save each semester immediately so next semester in group gets updated same-parity workloads & room locks
          await api.post('/timetables/save-ml', {
            semester: semNum,
            branch: config.branch,
            rawSchedules: res.data.data.rawSchedules
          });

          if (res.data && res.data.data) {
            Object.assign(combinedMatrix, res.data.data.matrix || {});
            Object.assign(combinedRawSchedules, res.data.data.rawSchedules || {});
            newBySemesterResults[semNum] = res.data.data;
            lastMessage = res.data.message;
          }
        }

        setProgress(100);
        setResult({
          success: true,
          message: lastMessage || 'Grouped timetables generated successfully',
          data: {
            matrix: combinedMatrix,
            rawSchedules: combinedRawSchedules,
            slots: ["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"]
          }
        });
        setBySemesterResults(newBySemesterResults);
        setPreviewSemester(semsToGenerate[0]);
        setShowPreview(true);
        alert(`Grouped Timetables for Semesters ${semsToGenerate.join(', ')} generated and saved successfully according to their own inputs!`);
      }
    } catch (err) {
      console.error("Generation error:", err);
      alert(err.response?.data?.error || err.message || 'Generation failed. Conflicts detected.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const element = document.getElementById('timetable-preview');
    if (!element) return;
    
    const opt = {
      margin:       0.5,
      filename:     `Timetable_Sem${config.semester}_${config.branch}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const getAllSessions = () => {
    const all = [];
    if (result && result.data && result.data.rawSchedules) {
      Object.keys(result.data.rawSchedules).forEach(divName => {
        result.data.rawSchedules[divName].forEach(session => {
          all.push({ ...session, divisionName: divName });
        });
      });
    }
    return all;
  };

  const getFacultyGrid = (facultyId) => {
    const sessions = getAllSessions().filter(s => s.faculty.some(f => f._id === facultyId));
    const grid = {
      Monday: {}, Tuesday: {}, Wednesday: {}, Thursday: {}, Friday: {}, Saturday: {}
    };
    sessions.forEach(s => {
      const sub = subjects.find(sub => sub._id === s.subject._id) || s.subject;
      const rm = rooms.find(r => r._id === s.room?._id) || s.room;
      grid[s.day][s.startTime] = {
        subject: sub,
        room: rm,
        divisionName: s.divisionName,
        batch: s.batch
      };
    });
    return grid;
  };

  const getRoomGrid = (roomId) => {
    const sessions = getAllSessions().filter(s => s.room?._id === roomId);
    const grid = {
      Monday: {}, Tuesday: {}, Wednesday: {}, Thursday: {}, Friday: {}, Saturday: {}
    };
    sessions.forEach(s => {
      const sub = subjects.find(sub => sub._id === s.subject._id) || s.subject;
      const facNames = s.faculty.map(f => {
        const fullFac = faculties.find(fac => fac._id === f._id);
        return fullFac ? fullFac.name : 'Faculty';
      }).join(' & ');
      
      grid[s.day][s.startTime] = {
        subject: sub,
        facultyName: facNames,
        divisionName: s.divisionName,
        batch: s.batch
      };
    });
    return grid;
  };

  const getLabAllocationList = () => {
    const sessions = getAllSessions().filter(s => s.batch && s.batch.batchName);
    const grouped = {};
    sessions.forEach(s => {
      const key = `${s.day} @ ${s.startTime}`;
      if (!grouped[key]) {
        grouped[key] = {
          day: s.day,
          time: s.startTime,
          allocations: []
        };
      }
      
      const sub = subjects.find(sub => sub._id === s.subject._id) || s.subject;
      const rm = rooms.find(r => r._id === s.room?._id) || s.room;
      const facs = s.faculty.map(f => {
        const fullFac = faculties.find(fac => fac._id === f._id);
        return fullFac ? fullFac.name : 'Faculty';
      }).join(' & ');
      
      grouped[key].allocations.push({
        division: s.divisionName,
        batch: s.batch.batchName,
        subject: sub,
        faculty: facs,
        room: rm
      });
    });
    
    return Object.values(grouped).sort((a, b) => {
      const dayOrder = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
      if (dayOrder[a.day] !== dayOrder[b.day]) {
        return dayOrder[a.day] - dayOrder[b.day];
      }
      return a.time.localeCompare(b.time);
    });
  };

  const getFacultyMaxWorkload = (facultyId) => {
    if (specialRoles.hod === facultyId) return 12;
    if (specialRoles.deans && specialRoles.deans.includes(facultyId)) return 12;
    if (specialRoles.dean === facultyId) return 12;
    if (specialRoles.mic === facultyId) return 14;
    if (specialRoles.naac === facultyId) return 14;
    const teacher = faculties.find(f => f._id === facultyId);
    if (teacher && typeof teacher.maxWorkloadPerWeek === 'number' && teacher.maxWorkloadPerWeek > 0 && teacher.maxWorkloadPerWeek <= 24) {
      return teacher.maxWorkloadPerWeek;
    }

    if (!teacher) return 16;

    const name = (teacher.name || '').toLowerCase();
    const desig = (teacher.designation || '').toLowerCase();

    // Specific Faculty Mapping Rules from reference
    if (name.includes('umakant') || name.includes('u. p. kulkarni') || name.includes('u p kulkarni')) return 12; // Professor & HOD
    if (name.includes('shrihari') || name.includes('joshi')) return 13; // Professor + NAAC Coordinator
    if (name.includes('jayateerth') || name.includes('vadavi')) return 12; // Associate Professor + Dean SW
    if (name.includes('raghavendra')) return 12; // Associate Professor + MIS Officer
    if (name.includes('shrinivas') || name.includes('s. b. kulkarni') || name.includes('s b kulkarni')) return 12; // Associate Professor + Dean IPD
    if (name.includes('smitesh') || name.includes('patravali')) return 14; // Assistant Professor + Coordinator CCF

    // Designation-based workload rules
    if (desig.includes('principal')) return 6;
    if (desig.includes('dean') || desig.includes('coe')) return 12;
    if (desig.includes('hod')) {
      if (desig.includes('asst') || desig.includes('assistant')) return 14;
      return 12;
    }
    if (desig.includes('mis officer') || desig.includes('ccf')) {
      if (desig.includes('asst') || desig.includes('assistant')) return 14;
      return 12;
    }
    if (desig.includes('naac')) {
      if (desig.includes('asst') || desig.includes('assistant')) return 15;
      return 13;
    }
    if (desig.includes('professor') || desig.includes('associate')) return 14;
    
    return 16; // Assistant Professor default
  };

  const getFacultyOptionsForSubject = (divName, subjectId, type, labIndex) => {
     const sub = subjects.find(s => s._id === subjectId);
     const requiredHours = type === 'theory' 
         ? ((sub.lectureHours || 0) + (sub.tutorialHours || 0))
         : (sub.practicalHours || 0);
         
     const dynamicWorkloads = calculateDynamicWorkloadsFrom(facultyMapping);
     
     // Filter faculties by department/name for Maths, Physics, Chemistry and Computer Science
     let filteredFaculties = faculties;
     if (sub) {
       const subNameLower = (sub.subjectName || '').toLowerCase();
       const subCodeLower = (sub.subjectCode || '').toLowerCase();
       const subDeptLower = (sub.department || '').toLowerCase();

       const isMath = subNameLower.includes('math') || subNameLower.includes('mats') || subCodeLower.includes('mat') || subCodeLower.includes('mac') || subDeptLower.includes('math');
       const isPhysics = subNameLower.includes('physics') || subNameLower.includes('phys') || subCodeLower.includes('phy') || subDeptLower.includes('physics') || subDeptLower.includes('phys');
       const isChemistry = subNameLower.includes('chemistry') || subNameLower.includes('chem') || subCodeLower.includes('che') || subDeptLower.includes('chemistry') || subDeptLower.includes('chem');
       const isElectrical = subNameLower.includes('electrical') || subNameLower.includes('electronics') || subCodeLower.includes('ee1') || subCodeLower.includes('esc142') || subCodeLower.includes('esc243') || subCodeLower.includes('eee') || subCodeLower.includes('ece') || subDeptLower.includes('elect') || subDeptLower.includes('eee');

       if (isMath) {
         filteredFaculties = faculties.filter(f => (f.department || '').toLowerCase().includes('math'));
       } else if (isPhysics) {
         filteredFaculties = faculties.filter(f => (f.department || '').toLowerCase().includes('phys'));
       } else if (isChemistry) {
         filteredFaculties = faculties.filter(f => (f.department || '').toLowerCase().includes('chem') || (f.department || '').toLowerCase().includes('chemistry'));
       } else if (isElectrical) {
         filteredFaculties = faculties.filter(f => (f.department || '').toLowerCase().includes('elect') || (f.department || '').toLowerCase().includes('eee'));
       } else {
         filteredFaculties = faculties.filter(f => (f.department || '').toLowerCase().includes('cse') || (f.department || '').toLowerCase().includes('computer') || (f.department || '').toLowerCase().includes('other'));
       }
     }
         
     return filteredFaculties.map(f => {
       const dynamicAllocated = dynamicWorkloads[f._id] || 0;
       const totalUsed = (f.currentWorkload || 0) + dynamicAllocated;
       const max = getFacultyMaxWorkload(f._id);
       
       const isCurrentlySelected = type === 'theory' 
            ? facultyMapping[divName]?.[subjectId]?.theory === f._id
            : facultyMapping[divName]?.[subjectId]?.lab?.[labIndex] === f._id;
            
       let isFull = false;
       if (!isCurrentlySelected) {
          isFull = (totalUsed + requiredHours) > max;
       }

       return {
         value: f._id,
         label: `${f.name} (${totalUsed}/${max} hrs) ${isFull && !isCurrentlySelected ? ' - NO HOURS LEFT' : ''}`,
         isDisabled: isFull && !isCurrentlySelected
       };
     });
  };

  // Removed duplicate functions handleFixedTimingChange and addFixedTiming

  const handleSaveTimetables = async () => {
    try {
      await api.post('/timetables/save-ml', {
        semester: config.semester,
        branch: config.branch,
        rawSchedules: result.data.rawSchedules
      });
      alert('Timetables saved successfully to database!');
    } catch (error) {
      console.error(error);
      alert('Failed to save timetables');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center tracking-tight">
            <FiCpu className="mr-3 text-indigo-600" /> AI Generator
          </h1>
          <p className="text-gray-500 text-sm mt-1">Configure subjects, map faculties, and generate conflict-free timetables.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={loading || subjects.length === 0}
          className={`flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-indigo-300 transition-all font-bold ${
            loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'
          }`}
        >
          {loading ? (
            <><FiRefreshCw className="mr-2 animate-spin" /> Generating...</>
          ) : (
            <><FiZap className="mr-2" /> {
              genMode === 'priority' 
                ? `Generate Priority ${cycle === 'odd' ? '1st' : '2nd'} Semester`
                : `Generate ${cycle === 'odd' ? '3rd, 5th & 7th' : '4th & 6th'} Semesters Together`
            }</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Config & Subjects */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center tracking-wider">
              <FiSettings className="mr-2 text-indigo-500" /> Setup & Cycle Control
            </h3>
            <div className="space-y-5">
              {/* 1. Cycle Selector */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3.5 rounded-xl border border-indigo-100 space-y-2">
                <label className="block text-[11px] font-black text-indigo-900 uppercase tracking-wider">
                  1. Academic Cycle
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCycleChange('odd')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                      cycle === 'odd'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Odd Semester</span>
                    <span className="text-[9px] opacity-85">(1st, 3rd, 5th, 7th)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCycleChange('even')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                      cycle === 'even'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Even Semester</span>
                    <span className="text-[9px] opacity-85">(2nd, 4th, 6th)</span>
                  </button>
                </div>
              </div>

              {/* 2. Generation Phase Selector */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider">
                  2. Generation Phase
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleModeChange('priority')}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                      genMode === 'priority'
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Priority ({cycle === 'odd' ? '1st Sem' : '2nd Sem'})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange('grouped')}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                      genMode === 'grouped'
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Grouped ({cycle === 'odd' ? '3rd, 5th, 7th' : '4th, 6th'})
                  </button>
                </div>
              </div>

              {/* Grouped Semester Selector Pill Tabs */}
              {genMode === 'grouped' && (
                <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-indigo-900 uppercase flex justify-between items-center">
                    <span>Map Inputs Semester by Semester:</span>
                    <span className="text-[10px] text-indigo-600 font-bold">
                      (Saved {(cycle === 'odd' ? [3, 5, 7] : [4, 6]).filter(s => savedSemesters[s]).length}/{(cycle === 'odd' ? [3, 5, 7] : [4, 6]).length})
                    </span>
                  </label>
                  <div className="flex gap-2">
                    {(cycle === 'odd' ? [3, 5, 7] : [4, 6]).map(semNum => (
                      <button
                        key={semNum}
                        type="button"
                        onClick={() => handleSelectSemester(semNum)}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-extrabold transition-all flex flex-col items-center gap-1 ${
                          config.semester === semNum
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        <span>Sem {semNum}</span>
                        {savedSemesters[semNum] ? (
                          <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-bold">✓ Saved</span>
                        ) : (
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Unsaved</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Save & Edit Semester Configuration Card */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                      Sem {config.semester} Configuration Status
                    </h4>
                    <p className="text-[10px] text-indigo-700">Save inputs for Semester {config.semester} before generating.</p>
                  </div>
                  {savedSemesters[config.semester] ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                      <FiCheckCircle className="mr-1 text-green-600" /> Saved
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Unsaved
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {savedSemesters[config.semester] ? (
                    <button
                      type="button"
                      onClick={() => handleEditSemesterInputs(config.semester)}
                      className="w-full py-2 px-3 bg-white hover:bg-gray-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg transition-all shadow-sm"
                    >
                      Edit Sem {config.semester} Inputs
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSaveSemesterInputs(config.semester)}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <FiCheckCircle /> Save Sem {config.semester} Inputs
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Branch</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={config.branch}
                  onChange={(e) => setConfig({...config, branch: e.target.value})}
                >
                  <option value="CSE">Computer Science (CSE)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-2">Current Active Semester</label>
                <select 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  value={config.semester}
                  onChange={(e) => setConfig({...config, semester: parseInt(e.target.value)})}
                >
                  {(cycle === 'odd' ? [1, 3, 5, 7] : [2, 4, 6]).map(s => (
                    <option key={s} value={s}>Semester {s} {s === (cycle === 'odd' ? 1 : 2) ? '(Priority)' : '(Grouped)'}</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-600 mb-2">Number of Classes (Divisions)</label>
                <input 
                  type="number"
                  min="1" max="10"
                  value={numDivisions}
                  onChange={handleNumDivisionsChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>

              {divisions.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-600">Class Strengths</label>
                  {divisions.map((div, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-12 text-gray-500">{div.name}</span>
                      <input 
                        type="number" 
                        value={div.strength}
                        onChange={(e) => handleStrengthChange(idx, e.target.value)}
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-indigo-500"
                        placeholder="Strength"
                      />
                    </div>
                  ))}
                </div>
              )}
              
               <div className="pt-4 border-t border-gray-100 space-y-3">
                 <h3 className="text-sm font-bold text-gray-700">Assign Faculty Roles</h3>
                 <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">HOD (Max 12 hrs/week)</label>
                      <Select options={faculties.map(f => ({value: f._id, label: f.name}))} onChange={v => setSpecialRoles(p => ({...p, hod: v?.value}))} isClearable isSearchable placeholder="Search HOD..." className="text-xs" />
                    </div>

                    {/* Number of Deans Input & Dean Selection Options */}
                    <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-extrabold text-indigo-900 mb-1">
                          Number of Deans
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={numDeans}
                          onChange={e => handleNumDeansChange(e.target.value)}
                          className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 outline-none focus:border-indigo-500"
                          placeholder="Enter number of Deans"
                        />
                      </div>

                      {numDeans > 0 && Array.from({ length: numDeans }).map((_, idx) => (
                        <div key={idx} className="space-y-1">
                          <label className="block text-[10px] font-bold text-indigo-800">
                            Dean {numDeans > 1 ? idx + 1 : ''} Faculty Member (Max 12 hrs/week)
                          </label>
                          <Select
                            options={faculties.map(f => ({ value: f._id, label: f.name }))}
                            value={faculties.filter(f => f._id === (specialRoles.deans?.[idx] || '')).map(f => ({ value: f._id, label: f.name }))[0] || null}
                            onChange={v => handleDeanSelect(idx, v?.value || '')}
                            isClearable
                            isSearchable
                            placeholder={`Search Dean ${numDeans > 1 ? idx + 1 : ''}...`}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">MIC + Asst. Prof (Max 14 hrs/week)</label>
                      <Select options={faculties.map(f => ({value: f._id, label: f.name}))} onChange={v => setSpecialRoles(p => ({...p, mic: v?.value}))} isClearable isSearchable placeholder="Search MIC..." className="text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-1">NAAC Coord. + Asst. Prof (Max 14 hrs/week)</label>
                      <Select options={faculties.map(f => ({value: f._id, label: f.name}))} onChange={v => setSpecialRoles(p => ({...p, naac: v?.value}))} isClearable isSearchable placeholder="Search NAAC Coord..." className="text-xs" />
                    </div>
                 </div>
                 <p className="text-[10px] text-gray-400 mt-2 font-bold">* All other unselected faculties default to Assistant Professor (Max 16 hrs/week)</p>
               </div>
            </div>
          </div>

          {/* Subjects Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-800 uppercase mb-4 flex items-center">
              <FiBookOpen className="mr-2" /> Semester Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                <span className="text-xs font-bold text-gray-500">Total Subjects</span>
                <div className="text-xl font-bold text-gray-800">{subjects.length}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                <FiClock className="text-indigo-600" />
                Subject Timings & Constraints
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {(config.semester == 1) && "Enter mandatory timings for Mathematics and Chemistry."}
                {(config.semester == 2) && "Enter mandatory timings for Mathematics and Physics."}
                {(config.semester == 5) && "Set timing for Program Elective (applied across all divisions)."}
                {(config.semester == 6 || config.semester == 7) && "Set timings for Program Elective & Open Elective (applied across all divisions)."}
                {!([1, 2, 5, 6, 7].includes(parseInt(config.semester))) && "Force specific subjects to be scheduled at an exact day and time."}
              </p>

              {/* Sem 5 Elective Timing (Dynamic Inputs based on Credits) */}
              {(parseInt(config.semester) === 5) && (
                <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex justify-between items-center mb-3 border-b border-indigo-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900">Program Elective Timing</h4>
                      <p className="text-[11px] text-indigo-600">Applied to all divisions</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-sm">
                      <label className="text-[11px] font-bold text-indigo-900">Credits:</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="6" 
                        value={peCredits}
                        onChange={e => handleElectiveCreditsChange('pe', parseInt(e.target.value) || 1)}
                        className="w-12 p-0.5 bg-indigo-50 border border-indigo-300 rounded text-xs text-center font-bold text-indigo-900 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: peCredits }).map((_, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-indigo-600 font-bold w-12">Slot {idx + 1}</span>
                        <select 
                          className="min-w-0 p-2 bg-white border border-gray-200 rounded text-xs flex-1 outline-none font-medium"
                          value={(() => {
                            const peSub = subjects.find(s => (s.subjectCode || '').includes('UCSE') || (s.subjectName || '').toLowerCase().includes('elective') || s.subjectType === 'elective');
                            return peSub ? fixedTimings[divisions[0]?.name]?.[peSub._id]?.[idx]?.day || '' : '';
                          })()}
                          onChange={e => handleGlobalElectiveTimingChange('pe', idx, 'day', e.target.value)}
                        >
                          <option value="">Day</option>
                          <option value="N/A">N/A</option>
                          <option value="Monday">Mon</option>
                          <option value="Tuesday">Tue</option>
                          <option value="Wednesday">Wed</option>
                          <option value="Thursday">Thu</option>
                          <option value="Friday">Fri</option>
                          <option value="Saturday">Sat</option>
                        </select>
                        <select 
                          className="min-w-0 p-2 bg-white border border-gray-200 rounded text-xs flex-1 outline-none font-medium"
                          value={(() => {
                            const peSub = subjects.find(s => (s.subjectCode || '').includes('UCSE') || (s.subjectName || '').toLowerCase().includes('elective') || s.subjectType === 'elective');
                            return peSub ? fixedTimings[divisions[0]?.name]?.[peSub._id]?.[idx]?.time || '' : '';
                          })()}
                          onChange={e => handleGlobalElectiveTimingChange('pe', idx, 'time', e.target.value)}
                        >
                          <option value="">Time</option>
                          <option value="N/A">N/A</option>
                          {["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sem 6 & Sem 7 Elective Timings (Dynamic Inputs based on Credits) */}
              {(parseInt(config.semester) === 6 || parseInt(config.semester) === 7) && (
                <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-4">
                  <h4 className="text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-2">Elective Timings (Applied to all divisions)</h4>
                  
                  {/* Open Elective */}
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center mb-1 border-b border-indigo-50 pb-2">
                      <h5 className="text-[11px] font-bold text-indigo-800">Open Elective</h5>
                      <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <label className="text-[10px] font-bold text-indigo-900">Credits:</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="6" 
                          value={oeCredits}
                          onChange={e => handleElectiveCreditsChange('oe', parseInt(e.target.value) || 1)}
                          className="w-10 p-0.5 bg-white border border-indigo-300 rounded text-xs text-center font-bold text-indigo-900 outline-none"
                        />
                      </div>
                    </div>
                    {Array.from({ length: oeCredits }).map((_, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-gray-500 font-bold w-12">Slot {idx + 1}</span>
                        <select 
                          className="min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs flex-1 outline-none font-medium"
                          value={(() => {
                            const oeSub = subjects.find(s => (s.subjectCode || '').includes('UCSO') || (s.subjectName || '').toLowerCase().includes('open'));
                            return oeSub ? fixedTimings[divisions[0]?.name]?.[oeSub._id]?.[idx]?.day || '' : '';
                          })()}
                          onChange={e => handleGlobalElectiveTimingChange('oe', idx, 'day', e.target.value)}
                        >
                          <option value="">Day</option>
                          <option value="N/A">N/A</option>
                          <option value="Monday">Mon</option>
                          <option value="Tuesday">Tue</option>
                          <option value="Wednesday">Wed</option>
                          <option value="Thursday">Thu</option>
                          <option value="Friday">Fri</option>
                          <option value="Saturday">Sat</option>
                        </select>
                        <select 
                          className="min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs flex-1 outline-none font-medium"
                          value={(() => {
                            const oeSub = subjects.find(s => (s.subjectCode || '').includes('UCSO') || (s.subjectName || '').toLowerCase().includes('open'));
                            return oeSub ? fixedTimings[divisions[0]?.name]?.[oeSub._id]?.[idx]?.time || '' : '';
                          })()}
                          onChange={e => handleGlobalElectiveTimingChange('oe', idx, 'time', e.target.value)}
                        >
                          <option value="">Time</option>
                          <option value="N/A">N/A</option>
                          {["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Program Elective */}
                  <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center mb-1 border-b border-indigo-50 pb-2">
                      <h5 className="text-[11px] font-bold text-indigo-800">Program Elective</h5>
                      <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <label className="text-[10px] font-bold text-indigo-900">Credits:</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="6" 
                          value={peCredits}
                          onChange={e => handleElectiveCreditsChange('pe', parseInt(e.target.value) || 1)}
                          className="w-10 p-0.5 bg-white border border-indigo-300 rounded text-xs text-center font-bold text-indigo-900 outline-none"
                        />
                      </div>
                    </div>
                    {Array.from({ length: peCredits }).map((_, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-gray-500 font-bold w-12">Slot {idx + 1}</span>
                        <select 
                          className="min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs flex-1 outline-none font-medium"
                          value={(() => {
                            const peSub = subjects.find(s => (s.subjectCode || '').includes('UCSE') || (s.subjectName || '').toLowerCase().includes('program') || (s.subjectName || '').toLowerCase().includes('elective') || s.subjectType === 'elective');
                            return peSub ? fixedTimings[divisions[0]?.name]?.[peSub._id]?.[idx]?.day || '' : '';
                          })()}
                          onChange={e => handleGlobalElectiveTimingChange('pe', idx, 'day', e.target.value)}
                        >
                          <option value="">Day</option>
                          <option value="N/A">N/A</option>
                          <option value="Monday">Mon</option>
                          <option value="Tuesday">Tue</option>
                          <option value="Wednesday">Wed</option>
                          <option value="Thursday">Thu</option>
                          <option value="Friday">Fri</option>
                          <option value="Saturday">Sat</option>
                        </select>
                        <select 
                          className="min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs flex-1 outline-none font-medium"
                          value={(() => {
                            const peSub = subjects.find(s => (s.subjectCode || '').includes('UCSE') || (s.subjectName || '').toLowerCase().includes('program') || (s.subjectName || '').toLowerCase().includes('elective') || s.subjectType === 'elective');
                            return peSub ? fixedTimings[divisions[0]?.name]?.[peSub._id]?.[idx]?.time || '' : '';
                          })()}
                          onChange={e => handleGlobalElectiveTimingChange('pe', idx, 'time', e.target.value)}
                        >
                          <option value="">Time</option>
                          <option value="N/A">N/A</option>
                          {["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sem 1 & Sem 2 Dedicated Inputs for Core Subjects per Division */}
              {(parseInt(config.semester) === 1 || parseInt(config.semester) === 2) && divisions.map((div) => (
                <div key={div.name} className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-900 mb-3 border-b border-indigo-100 pb-2">Division: {div.name}</h4>
                  
                  {subjects.filter(s => {
                    const name = s.subjectName.toLowerCase();
                    if (config.semester == 1) return name.includes('math') || name.includes('chem');
                    if (config.semester == 2) return name.includes('math') || name.includes('phys');
                    return false;
                  }).map(subject => {
                    const totalHours = (subject.lectureHours || 0) + (subject.tutorialHours || 0);
                    return (
                      <div key={subject._id} className="mb-4">
                        <h5 className="text-xs font-bold text-indigo-700 mb-2">{subject.subjectName} ({totalHours} Credits)</h5>
                        <div className="grid grid-cols-1 gap-2">
                          {Array.from({ length: totalHours }).map((_, i) => (
                            <div key={i} className="flex gap-2 items-center">
                               <span className="text-[10px] text-gray-500 font-bold w-12">Slot {i+1}</span>
                               <select 
                                 className="min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs flex-1 outline-none"
                                 value={fixedTimings[div.name]?.[subject._id]?.[i]?.day || ''}
                                 onChange={e => handleFixedTimingChange(div.name, subject._id, i, 'day', e.target.value)}
                               >
                                 <option value="">Day</option>
                                 <option value="N/A">N/A</option>
                                 <option value="Monday">Mon</option>
                                 <option value="Tuesday">Tue</option>
                                 <option value="Wednesday">Wed</option>
                                 <option value="Thursday">Thu</option>
                                 <option value="Friday">Fri</option>
                                 <option value="Saturday">Sat</option>
                               </select>
                               <select 
                                 className="min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs flex-1 outline-none"
                                 value={fixedTimings[div.name]?.[subject._id]?.[i]?.time || ''}
                                 onChange={e => handleFixedTimingChange(div.name, subject._id, i, 'time', e.target.value)}
                               >
                                 <option value="">Time</option>
                                 <option value="N/A">N/A</option>
                                 {["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"].map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Extra / Special Subjects (e.g. UHV, EVS) - Per Division Timing Inputs */}
              {(() => {
                const extraSubjects = subjects.filter(s => {
                  const code = (s.subjectCode || '').toUpperCase();
                  const name = (s.subjectName || '').toLowerCase();
                  return name.includes('uhv') || name.includes('human') || name.includes('universal') || 
                         name.includes('environment') || name.includes('evs') || name.includes('constitution') || 
                         name.includes('audit') || name.includes('value') || name.includes('kanaka') || 
                         code.includes('UHV') || code.includes('AECC') || code.includes('HS') || code.includes('EVS');
                });

                if (extraSubjects.length === 0) return null;

                return (
                  <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-4">
                    <div className="border-b border-purple-100 pb-2">
                      <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider">
                        Extra Subject Timings (UHV, EVS, Audit Courses)
                      </h4>
                      <p className="text-[11px] text-purple-700 font-medium">
                        Set timings separately for each division ({divisions.length} division{divisions.length > 1 ? 's' : ''} = {divisions.length} timing input{divisions.length > 1 ? 's' : ''}).
                      </p>
                    </div>

                    {extraSubjects.map(subject => {
                      const totalHours = (subject.lectureHours || 0) + (subject.tutorialHours || 0) || 1;
                      return (
                        <div key={subject._id} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm space-y-3">
                          <h5 className="text-xs font-bold text-purple-900 border-b border-purple-50 pb-1 flex justify-between">
                            <span>{subject.subjectName} ({subject.subjectCode})</span>
                            <span className="text-[10px] text-purple-600 font-bold">{totalHours} hr/week per div</span>
                          </h5>
                          
                          <div className="space-y-2">
                            {divisions.map((div) => (
                              <div key={div.name} className="bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 flex flex-col gap-1.5">
                                <span className="text-[11px] font-extrabold text-purple-950">
                                  Division {div.name} Timing Input:
                                </span>
                                {Array.from({ length: totalHours }).map((_, i) => (
                                  <div key={i} className="flex gap-2 items-center">
                                    <span className="text-[10px] text-purple-700 font-bold w-12">Slot {i + 1}</span>
                                    <select 
                                      className="min-w-0 p-1.5 bg-white border border-purple-200 rounded text-xs flex-1 outline-none font-medium text-gray-800"
                                      value={fixedTimings[div.name]?.[subject._id]?.[i]?.day || ''}
                                      onChange={e => handleFixedTimingChange(div.name, subject._id, i, 'day', e.target.value)}
                                    >
                                      <option value="">Select Day</option>
                                      <option value="N/A">N/A</option>
                                      <option value="Monday">Mon</option>
                                      <option value="Tuesday">Tue</option>
                                      <option value="Wednesday">Wed</option>
                                      <option value="Thursday">Thu</option>
                                      <option value="Friday">Fri</option>
                                      <option value="Saturday">Sat</option>
                                    </select>
                                    <select 
                                      className="min-w-0 p-1.5 bg-white border border-purple-200 rounded text-xs flex-1 outline-none font-medium text-gray-800"
                                      value={fixedTimings[div.name]?.[subject._id]?.[i]?.time || ''}
                                      onChange={e => handleFixedTimingChange(div.name, subject._id, i, 'time', e.target.value)}
                                    >
                                      <option value="">Select Time</option>
                                      <option value="N/A">N/A</option>
                                      {["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Generic Input for other subjects per division */}
              <div className="pt-2 border-t border-gray-100 mt-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Custom Slot Timings per Division</h4>
                <div className="flex flex-col gap-2 mb-3">
                   <div className="flex gap-2">
                     <select className="p-2 bg-gray-50 border border-gray-200 rounded text-xs flex-1 outline-none font-medium" value={selectedFixDiv} onChange={e => setSelectedFixDiv(e.target.value)}>
                       <option value="ALL">All Divisions</option>
                       {divisions.map(d => <option key={d.name} value={d.name}>{d.name} Only</option>)}
                     </select>
                     <select className="p-2 bg-gray-50 border border-gray-200 rounded text-xs flex-1 outline-none font-medium" value={selectedFixSub} onChange={e => setSelectedFixSub(e.target.value)}>
                       <option value="">-- Select Subject --</option>
                       {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
                     </select>
                   </div>
                   <div className="flex gap-2">
                     <select className="min-w-0 p-2 bg-gray-50 border border-gray-200 rounded text-xs flex-1 outline-none font-medium" value={selectedFixDay} onChange={e => setSelectedFixDay(e.target.value)}>
                       <option value="">Select Day</option>
                       <option value="N/A">N/A</option>
                       <option value="Monday">Mon</option>
                       <option value="Tuesday">Tue</option>
                       <option value="Wednesday">Wed</option>
                       <option value="Thursday">Thu</option>
                       <option value="Friday">Fri</option>
                       <option value="Saturday">Sat</option>
                     </select>
                     <select className="min-w-0 p-2 bg-gray-50 border border-gray-200 rounded text-xs flex-1 outline-none font-medium" value={selectedFixTime} onChange={e => setSelectedFixTime(e.target.value)}>
                       <option value="">Select Time</option>
                       <option value="N/A">N/A</option>
                       {["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"].map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                   </div>
                   <button onClick={addFixedTiming} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-xs font-bold transition-colors shadow-sm">
                     Add Division Slot Timing
                   </button>
                </div>
              </div>
              
              <div className="space-y-1.5">
                {divisions.map(div => {
                  const divTimings = fixedTimings[div.name] || {};
                  return Object.keys(divTimings).map(subId => {
                    const validSlots = (divTimings[subId] || []).filter(t => t.day && t.day !== 'N/A' && t.time && t.time !== 'N/A');
                    if (validSlots.length === 0) return null;
                    const subName = subjects.find(s => s._id === subId)?.subjectName || 'Subject';
                    return (
                      <div key={`${div.name}-${subId}`} className="text-[10px] text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-200 flex justify-between items-center">
                        <div>
                          <strong className="text-indigo-800 font-bold">[{div.name}] {subName}: </strong> 
                          <span className="font-medium text-gray-600">{validSlots.map(t => `${t.day} @ ${t.time}`).join(' | ')}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setFixedTimings(prev => {
                              const updated = { ...prev };
                              if (updated[div.name]) {
                                delete updated[div.name][subId];
                              }
                              return updated;
                            });
                          }} 
                          className="text-red-500 hover:text-red-700 font-bold p-1"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Middle/Right Col: Faculty Mapping & Results */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="bg-white p-16 rounded-3xl shadow-lg border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{width: `${progress}%`}}></div>
              </div>
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <FiCpu className="text-indigo-600" size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Engine Processing...</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Running constraint satisfaction algorithms, preventing clashes, and balancing faculty workloads.
              </p>
            </div>
          ) : result ? (
             <div className="space-y-6 animate-slide-up">
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-green-800 flex items-center">
                    <FiCheckCircle className="mr-2" /> Timetable Generated Successfully
                  </h3>
                  <p className="text-sm text-green-600 mt-1">100% constraints satisfied. No clashes detected.</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSaveTimetables} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                    <FiCheckCircle /> Save to Database
                  </button>
                  <button onClick={handleExportPDF} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2">
                    <FiDownload /> Export PDF
                  </button>
                  <button onClick={() => setShowPreview(false)} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                    Hide Preview
                  </button>
                </div>
              </div>

              {/* View Selection Tab Toggler */}
              <div className="flex bg-gray-100 p-1.5 rounded-xl gap-2 border border-gray-200">
                <button 
                  onClick={() => setActiveTab('division')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'division' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Division View
                </button>
                <button 
                  onClick={() => setActiveTab('faculty')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'faculty' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Faculty View
                </button>
              </div>

              {/* Semester Selector Bar for Preview */}
              {genMode === 'grouped' && (
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">Select Semester Timetable:</span>
                    <div className="flex gap-2">
                      {(cycle === 'odd' ? [3, 5, 7] : [4, 6]).map(semNum => (
                        <button
                          key={semNum}
                          type="button"
                          onClick={() => setPreviewSemester(semNum)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                            previewSemester === semNum
                              ? 'bg-indigo-600 text-white shadow-md scale-[1.03]'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>Sem {semNum} Timetable</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-500">
                    Showing separate timetable for <span className="text-indigo-600">Semester {previewSemester}</span>
                  </span>
                </div>
              )}

              {/* Division-wise Timetables */}
              {activeTab === 'division' && showPreview && (() => {
                const currentData = bySemesterResults[previewSemester] || result?.data;
                const currentMatrix = currentData?.matrix;
                const currentSubjects = allSubjects[previewSemester] || subjects;
                const currentMapping = allFacultyMappings[previewSemester] || facultyMapping;

                if (!currentMatrix) return null;

                return Object.keys(currentMatrix).map(divId => {
                  const division = currentMatrix[divId];
                  const days = Object.keys(division.days);

                  return (
                    <div key={divId} id="timetable-preview" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
                      <div className="mb-4 text-center">
                        <h2 className="text-2xl font-black text-gray-800">Class Timetable - {config.branch} Sem {previewSemester}</h2>
                        <p className="text-gray-500 font-medium">Division: {division.divisionName}</p>
                      </div>
                      {(() => {
                        const divHas1230 = Object.values(division.days || {}).some(dayObj => dayObj && dayObj["12:30"] && dayObj["12:30"].type !== "busy");
                        return (
                          <>
                            <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                              <thead>
                                <tr>
                                  <th className="border border-gray-400 p-2 bg-gray-50 font-bold text-gray-700 text-center w-16">Days</th>
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>8:00 to</span><span>9:00 AM</span></div></th>
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>9:00 to</span><span>10:00 AM</span></div></th>
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>10:00 AM</span><span>10:30 AM</span></div></th>
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>10:30 to</span><span>11:30 AM</span></div></th>
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>11:30 to</span><span>12:30 PM</span></div></th>
                                  {divHas1230 ? (
                                    <>
                                      <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>12:30 to</span><span>1:30 PM</span></div></th>
                                      <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>1:30 to</span><span>2:30 PM</span></div></th>
                                    </>
                                  ) : (
                                    <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>12:30 to</span><span>2:30 PM</span></div></th>
                                  )}
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>2:30 to</span><span>3:30 PM</span></div></th>
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>3:30 to</span><span>4:30 PM</span></div></th>
                                </tr>
                              </thead>
                              <tbody>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, dayIndex) => {
                                  const daySlots = [
                                    { time: '08:00', type: 'class' },
                                    { time: '09:00', type: 'class' },
                                    { type: 'break', label: 'T E A   B R E A K' },
                                    { time: '10:30', type: 'class' },
                                    { time: '11:30', type: 'class' },
                                    ...(divHas1230 ? [
                                      { time: '12:30', type: 'class' },
                                      { type: 'break', label: 'L U N C H   B R E A K' }
                                    ] : [
                                      { type: 'break', label: 'L U N C H   B R E A K' }
                                    ]),
                                    { time: '14:30', type: 'class' },
                                    { time: '15:30', type: 'class' }
                                  ];
                              
                              let skipNext = false;

                              return (
                                <tr key={day}>
                                  <td className="border border-gray-400 p-2 font-bold text-gray-800 bg-gray-50 text-center">{day.substring(0,3)}</td>
                                  {daySlots.map((slot, index) => {
                                    if (slot.type === 'break') {
                                      if (dayIndex === 0) {
                                        return <td key={index} rowSpan="6" className="border border-gray-400 bg-white text-center text-[10px] font-bold tracking-[0.2em]" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>{slot.label}</td>;
                                      }
                                      return null;
                                    }

                                    if (skipNext) {
                                      skipNext = false;
                                      return null;
                                    }

                                    const cell = division.days[day][slot.time];
                                    
                                    if (cell?.type === 'busy') return null;

                                    if (!cell) {
                                      return <td key={index} className="border border-gray-400 p-1 bg-white text-center text-gray-300"></td>;
                                    }

                                    const isLab = cell.type === 'lab';
                                    const colSpan = isLab ? 2 : 1;
                                    if (isLab) skipNext = true;
                                    
                                    const facNames = Array.isArray(cell.faculty) ? cell.faculty.filter(f=>f).map(f => f.name || '').join(' / ') : (cell.faculty?.name || '');
                                    const roomString = Array.isArray(cell.room) 
                                      ? cell.room.filter(r=>r).map(r => (r.roomNumber || '').replace('R', '')).join('/') 
                                      : (cell.room?.roomNumber || '').replace('R', '');

                                    return (
                                      <td key={index} colSpan={colSpan} className={`border border-gray-400 p-1 text-center align-middle ${isLab ? 'bg-indigo-50' : 'bg-white'}`}>
                                        <div className="font-bold text-[11px] text-gray-800">{cell.subject?.subjectCode || ''}{roomString ? ` (R N ${roomString})` : ''}</div>
                                        <div className="text-[10px] text-gray-600 mt-1">{facNames}</div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Faculty-Course-Credit Table */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                          <h3 className="text-base font-black text-gray-800 mb-3 text-center">Faculty - Course - Credit Mapping (Sem {previewSemester})</h3>
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-gray-50 font-bold text-gray-700">
                                <th className="border border-gray-400 p-2 text-center w-32">Course Code</th>
                                <th className="border border-gray-400 p-2">Course Title</th>
                                <th className="border border-gray-400 p-2 text-center w-20">Credits</th>
                                <th className="border border-gray-400 p-2 text-center w-24">L-T-P</th>
                                <th className="border border-gray-400 p-2">Course Instructor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentSubjects.map(sub => {
                                const instructors = [];
                                const map = (currentMapping[division.divisionName] || {})[sub._id] || {};
                                if (map.theory) {
                                  const fac = faculties.find(f => f._id === map.theory);
                                  if (fac) instructors.push(fac.name);
                                }
                                if (map.lab && map.lab.length > 0) {
                                  map.lab.forEach(id => {
                                    if (id) {
                                      const fac = faculties.find(f => f._id === id);
                                      if (fac && !instructors.includes(fac.name)) instructors.push(fac.name);
                                    }
                                  });
                                }
                                const instructorName = instructors.length > 0 ? instructors.join(' / ') : 'TBD';

                                return (
                                  <tr key={sub._id}>
                                    <td className="border border-gray-400 p-2 text-center font-mono">{sub.subjectCode}</td>
                                    <td className="border border-gray-400 p-2 font-medium">{sub.subjectName}</td>
                                    <td className="border border-gray-400 p-2 text-center">{sub.credits}</td>
                                    <td className="border border-gray-400 p-2 text-center font-mono">{getLTP(sub)}</td>
                                    <td className="border border-gray-400 p-2">{instructorName}</td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-gray-50 font-bold">
                                <td colSpan="2" className="border border-gray-400 p-2 text-right">Total</td>
                                <td className="border border-gray-400 p-2 text-center">
                                  {currentSubjects.reduce((sum, sub) => {
                                    const val = parseFloat(sub.credits);
                                    return isNaN(val) ? sum : sum + val;
                                  }, 0)}
                                </td>
                                <td colSpan="2" className="border border-gray-400 p-2"></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              );
            });
          })()}

              {/* Faculty-wise Timetables */}
              {activeTab === 'faculty' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <label className="text-xs font-bold text-gray-600">Select Faculty Member:</label>
                    <select 
                      value={selectedFacultyId} 
                      onChange={e => setSelectedFacultyId(e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none focus:border-indigo-500 min-w-[200px]"
                    >
                      <option value="">-- Select Faculty --</option>
                      {faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.department})</option>)}
                    </select>
                  </div>
                  {selectedFacultyId ? (
                    <div id="timetable-preview" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
                      <div className="mb-4 text-center">
                        <h2 className="text-2xl font-black text-gray-800">Faculty Timetable</h2>
                        <p className="text-gray-500 font-medium">Instructor: {faculties.find(f => f._id === selectedFacultyId)?.name}</p>
                      </div>
                    {(() => {
                      const facultyGrid = getFacultyGrid(selectedFacultyId);
                      const facHas1230 = Object.values(facultyGrid || {}).some(dayObj => dayObj && dayObj["12:30"]);
                      return (
                        <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                          <thead>
                            <tr>
                              <th className="border border-gray-400 p-2 bg-gray-50 font-bold text-gray-700 text-center w-16">Days</th>
                              <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>8:00 to</span><span>9:00 AM</span></div></th>
                              <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>9:00 to</span><span>10:00 AM</span></div></th>
                              <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>10:00 AM</span><span>10:30 AM</span></div></th>
                              <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>10:30 to</span><span>11:30 AM</span></div></th>
                              <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>11:30 to</span><span>12:30 PM</span></div></th>
                              {facHas1230 ? (
                                <>
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>12:30 to</span><span>1:30 PM</span></div></th>
                                  <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>1:30 to</span><span>2:30 PM</span></div></th>
                                </>
                              ) : (
                                <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>12:30 to</span><span>2:30 PM</span></div></th>
                              )}
                              <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>2:30 to</span><span>3:30 PM</span></div></th>
                              <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>3:30 to</span><span>4:30 PM</span></div></th>
                            </tr>
                          </thead>
                          <tbody>
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, dayIndex) => {
                              const daySlots = [
                                { time: '08:00', type: 'class' },
                                { time: '09:00', type: 'class' },
                                { type: 'break', label: 'T E A   B R E A K' },
                                { time: '10:30', type: 'class' },
                                { time: '11:30', type: 'class' },
                                ...(facHas1230 ? [
                                  { time: '12:30', type: 'class' },
                                  { type: 'break', label: 'L U N C H   B R E A K' }
                                ] : [
                                  { type: 'break', label: 'L U N C H   B R E A K' }
                                ]),
                                { time: '14:30', type: 'class' },
                                { time: '15:30', type: 'class' }
                              ];
                              
                              let skipNext = false;
                              const grid = facultyGrid;

                            return (
                              <tr key={day}>
                                <td className="border border-gray-400 p-2 font-bold text-gray-800 bg-gray-50 text-center">{day.substring(0,3)}</td>
                                {daySlots.map((slot, index) => {
                                  if (slot.type === 'break') {
                                    if (dayIndex === 0) {
                                      return <td key={index} rowSpan="6" className="border border-gray-400 bg-white text-center text-[10px] font-bold tracking-[0.2em]" style={{ writingMode: 'vertical-rl', textOrientation: 'upright' }}>{slot.label}</td>;
                                    }
                                    return null;
                                  }

                                  if (skipNext) {
                                    skipNext = false;
                                    return null;
                                  }

                                  const cell = grid[day][slot.time];
                                  
                                  if (!cell) {
                                    return <td key={index} className="border border-gray-400 p-1 bg-white text-center text-gray-300"></td>;
                                  }

                                  const isLab = !!cell.batch;
                                  const colSpan = isLab ? 2 : 1;
                                  if (isLab) skipNext = true;

                                  return (
                                    <td key={index} colSpan={colSpan} className={`border border-gray-400 p-1 text-center align-middle ${isLab ? 'bg-indigo-50' : 'bg-white'}`}>
                                      <div className="font-bold text-[11px] text-gray-800">
                                        {cell.subject?.subjectCode || cell.subject?.subjectName}
                                      </div>
                                      <div className="text-[10px] text-gray-600 mt-1">
                                        Room: {cell.room?.roomNumber || 'TBD'}
                                      </div>
                                      <div className="text-[9px] text-indigo-600 font-bold mt-0.5">
                                        {cell.divisionName} {cell.batch ? `(${cell.batch.batchName})` : ''}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-10 bg-white rounded-xl border border-gray-200 text-xs">Please select a faculty member to view their schedule.</p>
                  )}
                </div>
              )}


             </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <FiUsers className="mr-2 text-indigo-500" /> Map Faculty to Subjects
                </h3>
                <p className="text-xs text-gray-500 mt-1">Assign faculty for each division independently.</p>
              </div>

              {subjects.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400">No subjects found for Semester {config.semester} {config.branch}.</p>
                </div>
              ) : (
                <div className="p-6">
                  {divisions.map(div => (
                    <div key={div.name} className="mb-8 last:mb-0">
                      <h4 className="text-sm font-bold text-indigo-900 mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex justify-between items-center">
                        <span>Division: {div.name}</span>
                        <span className="text-xs font-normal text-indigo-600 bg-white px-2 py-1 rounded-full border border-indigo-200">Strength: {div.strength}</span>
                      </h4>
                      
                      <div className="space-y-4">
                        {subjects.map(sub => {
                          const isMixed = hasTheory(sub) && hasLab(sub);
                          return (
                            <div key={sub._id} className="p-5 bg-gray-50/50 rounded-xl border border-gray-200 hover:border-indigo-200 transition-colors">
                              <div className="flex flex-col md:flex-row md:items-start gap-6">
                                {/* Subject Info */}
                                <div className="md:w-1/3">
                                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 bg-indigo-100 text-indigo-800">
                                    {sub.subjectCode} • {isMixed ? 'Theory & Lab' : sub.subjectType}
                                  </div>
                                  <h4 className="font-bold text-gray-800 text-base leading-tight mb-2">{sub.subjectName}</h4>
                                  <div className="flex gap-3 mt-1 text-xs font-bold text-gray-500">
                                    <span>L: {sub.lectureHours}</span>
                                    <span>T: {sub.tutorialHours}</span>
                                    <span>P: {sub.practicalHours}</span>
                                    <span>Cr: {sub.credits}</span>
                                  </div>
                                </div>

                                {/* Faculty Selectors */}
                                <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Theory */}
                                  {(sub.lectureHours > 0 || sub.tutorialHours > 0) && (
                                    <div className={sub.practicalHours > 0 ? "" : "md:col-span-2"}>
                                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Theory Faculty</label>
                                      <Select
                                        options={getFacultyOptionsForSubject(div.name, sub._id, 'theory')}
                                        value={getFacultyOptionsForSubject(div.name, sub._id, 'theory').find(opt => opt.value === facultyMapping[div.name]?.[sub._id]?.theory) || null}
                                        onChange={(selected) => handleTheorySelect(div.name, sub._id, selected ? selected.value : '')}
                                        placeholder="Search faculty..."
                                        isSearchable={true}
                                        isClearable={true}
                                        className="text-xs"
                                        menuPortalTarget={document.body}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Labs */}
                                  {sub.practicalHours > 0 && (
                                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-t border-gray-100 pt-3">
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lab Main Faculty</label>
                                        <Select
                                          options={getFacultyOptionsForSubject(div.name, sub._id, 'lab', 0)}
                                          value={getFacultyOptionsForSubject(div.name, sub._id, 'lab', 0).find(opt => opt.value === facultyMapping[div.name]?.[sub._id]?.lab?.[0]) || null}
                                          onChange={(selected) => handleLabSelect(div.name, sub._id, selected ? selected.value : '', 0)}
                                          placeholder="Search Main..."
                                          isSearchable={true}
                                          isClearable={true}
                                          className="text-xs"
                                          menuPortalTarget={document.body}
                                          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Lab Assistant Faculty</label>
                                        <Select
                                          options={getFacultyOptionsForSubject(div.name, sub._id, 'lab', 1)}
                                          value={getFacultyOptionsForSubject(div.name, sub._id, 'lab', 1).find(opt => opt.value === facultyMapping[div.name]?.[sub._id]?.lab?.[1]) || null}
                                          onChange={(selected) => handleLabSelect(div.name, sub._id, selected ? selected.value : '', 1)}
                                          placeholder="Search Asst..."
                                          isSearchable={true}
                                          isClearable={true}
                                          className="text-xs"
                                          menuPortalTarget={document.body}
                                          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateTimetable;
