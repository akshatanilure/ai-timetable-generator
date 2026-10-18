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
  const [totalStudentStrength, setTotalStudentStrength] = useState(60);
  const [entryMode, setEntryMode] = useState('dynamic'); // 'dynamic' or 'static'
  
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
  const [program, setProgram] = useState(null); // 'UG' or 'PG'
  const [allEntryModes, setAllEntryModes] = useState({});
  const [savingToDb, setSavingToDb] = useState(false);
  const [isSavedToDb, setIsSavedToDb] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const getDefaultStartTime = (sem) => {
    const s = parseInt(sem, 10);
    return [1, 2, 5].includes(s) ? '08:00' : '09:00';
  };

  const [startTime, setStartTime] = useState(getDefaultStartTime(config.semester));
  const [allStartTimes, setAllStartTimes] = useState({});

  const handleStartTimeChange = (time) => {
    setStartTime(time);
    if (config.semester) {
      setAllStartTimes(prev => ({ ...prev, [config.semester]: time }));
    }
  };

  const isEntryModeSupported = (sem = config.semester, prog = program) => {
    const s = parseInt(sem);
    const activeProg = prog || 'UG';
    if (activeProg === 'PG') {
      return [1, 2, 3, 4].includes(s);
    }
    return s === 1 || s === 2;
  };

  const handleEntryModeChange = (mode) => {
    setEntryMode(mode);
    if (config.semester) {
      setAllEntryModes(prev => ({ ...prev, [config.semester]: mode }));
    }
  };

  const [allocatedClassroomsCount, setAllocatedClassroomsCount] = useState(1);

  const autoAllocateDivisions = (strengthVal, customRoomsCount, customRooms) => {
    const total = parseInt(strengthVal) !== undefined && !isNaN(parseInt(strengthVal)) ? parseInt(strengthVal) : (program === 'PG' ? 30 : 60);
    const roomList = customRooms || rooms;
    const availableClassrooms = roomList.filter(r => r.roomType === 'lecture' || !r.roomType);
    const availableCount = availableClassrooms.length;

    // Calculate number of divisions based on total student strength and available classrooms
    // E.g.: 60 students with 2 available classrooms -> 2 divisions of 30 each.
    // 60 students with 3 classrooms -> 3 divisions of 20 each.
    let numDivs = 1;
    if (customRoomsCount && customRoomsCount > 0) {
      numDivs = Math.min(Math.max(1, customRoomsCount), availableCount > 0 ? availableCount : customRoomsCount);
    } else if (availableCount > 1) {
      if (availableCount <= 3 && total % availableCount === 0) {
        numDivs = availableCount;
      } else {
        const firstCap = availableClassrooms[0]?.capacity || 60;
        numDivs = Math.min(availableCount, Math.max(1, Math.ceil(total / firstCap)));
      }
    }
    if (numDivs < 1) numDivs = 1;

    // Divide the total strength as evenly as possible ensuring sum equals original strength
    const base = Math.floor(total / numDivs);
    const remainder = total % numDivs;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newDivs = [];
    for (let i = 0; i < numDivs; i++) {
      const divStrength = base + (i < remainder ? 1 : 0);
      const assignedRoom = availableClassrooms[i % (availableClassrooms.length || 1)];
      const rNum = assignedRoom?.roomNumber || `Room-${i + 1}`;
      const displayRoom = rNum.startsWith('R') || rNum.startsWith('PG') ? rNum : `Room ${rNum}`;
      newDivs.push({
        name: `DIV-${alphabet[i]}`,
        strength: divStrength,
        assignedRoom: displayRoom,
        rawRoomNumber: rNum,
        roomId: assignedRoom ? assignedRoom._id : null,
        roomCapacity: assignedRoom ? assignedRoom.capacity : (program === 'PG' ? 30 : 60)
      });
    }

    setNumDivisions(numDivs);
    setDivisions(newDivs);
    setAllocatedClassroomsCount(numDivs);
    return newDivs;
  };

  const getGroupedSemesters = () => {
    if (program === 'PG') {
      return cycle === 'odd' ? [3] : [4];
    }
    return cycle === 'odd' ? [3, 5, 7] : [4, 6];
  };

  const getAllSemestersForCycle = () => {
    if (program === 'PG') {
      return cycle === 'odd' ? [1, 3] : [2, 4];
    }
    return cycle === 'odd' ? [1, 3, 5, 7] : [2, 4, 6];
  };

  const handleProgramChange = async (newProgram) => {
    setProgram(newProgram);
    const validSems = newProgram === 'PG'
      ? (cycle === 'odd' ? [1, 3] : [2, 4])
      : (cycle === 'odd' ? [1, 3, 5, 7] : [2, 4, 6]);

    let targetSem = config.semester;
    if (!validSems.includes(config.semester)) {
      targetSem = genMode === 'priority'
        ? (cycle === 'odd' ? 1 : 2)
        : (cycle === 'odd' ? 3 : 4);
      setConfig(prev => ({ ...prev, semester: targetSem }));
      setPreviewSemester(targetSem);
      setStartTime(allStartTimes[targetSem] || getDefaultStartTime(targetSem));
    }
    const updatedRooms = await fetchRooms(newProgram);
    const defaultStr = newProgram === 'PG' ? 30 : 60;
    setTotalStudentStrength(defaultStr);
    autoAllocateDivisions(defaultStr, null, updatedRooms);
  };

  const handleCycleChange = (newCycle) => {
    setCycle(newCycle);
    setGenMode('priority');
    const prioritySem = newCycle === 'odd' ? 1 : 2;
    setConfig(prev => ({ ...prev, semester: prioritySem }));
    setPreviewSemester(prioritySem);
    setEntryMode(allEntryModes[prioritySem] || 'dynamic');
    setStartTime(allStartTimes[prioritySem] || getDefaultStartTime(prioritySem));
  };

  const handleModeChange = (newMode) => {
    setGenMode(newMode);
    if (newMode === 'priority') {
      const prioritySem = cycle === 'odd' ? 1 : 2;
      setConfig(prev => ({ ...prev, semester: prioritySem }));
      setPreviewSemester(prioritySem);
      setEntryMode(allEntryModes[prioritySem] || 'dynamic');
      setStartTime(allStartTimes[prioritySem] || getDefaultStartTime(prioritySem));
    } else {
      const groupedDefaultSem = cycle === 'odd' ? 3 : 4;
      setConfig(prev => ({ ...prev, semester: groupedDefaultSem }));
      setPreviewSemester(groupedDefaultSem);
      setEntryMode(allEntryModes[groupedDefaultSem] || 'dynamic');
      setStartTime(allStartTimes[groupedDefaultSem] || getDefaultStartTime(groupedDefaultSem));
    }
  };

  const handleSelectSemester = (semNum) => {
    const currentSem = config.semester;
    if (currentSem) {
      setAllFacultyMappings(prev => ({ ...prev, [currentSem]: facultyMapping }));
      setAllDivisions(prev => ({ ...prev, [currentSem]: divisions }));
      setAllFixedTimings(prev => ({ ...prev, [currentSem]: fixedTimings }));
      setAllSubjects(prev => ({ ...prev, [currentSem]: subjects }));
      setAllEntryModes(prev => ({ ...prev, [currentSem]: entryMode }));
      setAllStartTimes(prev => ({ ...prev, [currentSem]: startTime }));
    }

    setConfig(prev => ({ ...prev, semester: semNum }));
    setStartTime(allStartTimes[semNum] || getDefaultStartTime(semNum));

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
    if (allEntryModes[semNum]) {
      setEntryMode(allEntryModes[semNum]);
    } else {
      setEntryMode('dynamic');
    }
  };

  const handleSaveSemesterInputs = (semNum) => {
    const s = semNum || config.semester;
    setAllDivisions(prev => ({ ...prev, [s]: divisions }));
    setAllFacultyMappings(prev => ({ ...prev, [s]: facultyMapping }));
    setAllFixedTimings(prev => ({ ...prev, [s]: fixedTimings }));
    setAllSubjects(prev => ({ ...prev, [s]: subjects }));
    setAllEntryModes(prev => ({ ...prev, [s]: entryMode }));
    setAllStartTimes(prev => ({ ...prev, [s]: startTime }));
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
    fetchRooms(program || 'UG');
  }, []);

  const fetchRooms = async (prog = program || 'UG') => {
    try {
      const res = await api.get('/rooms', { params: { program: prog } });
      const roomList = res.data.data || [];
      setRooms(roomList);
      if (roomList.length > 0) {
        setSelectedRoomId(roomList[0]._id);
      }
      return roomList;
    } catch (err) {
      console.error('Error fetching rooms', err);
      return [];
    }
  };

  useEffect(() => {
    if (config.semester && config.branch) {
      fetchSubjects(program || 'UG');
      fetchFaculties();
    }
  }, [config.semester, config.branch, program]);

  const fetchFaculties = async () => {
    try {
      const res = await api.get(`/teachers?semester=${config.semester}`);
      setFaculties(res.data.data);
    } catch (err) {
      console.error('Error fetching faculties', err);
    }
  };

  const fetchSubjects = async (prog = program || 'UG') => {
    try {
      const res = await api.get(`/subjects?semester=${config.semester}&branch=${config.branch}&program=${prog}`);
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
    const maxRooms = Math.max(1, rooms.filter(r => r.roomType === 'lecture' || !r.roomType).length);
    if (num > maxRooms) num = maxRooms;
    setAllocatedClassroomsCount(num);
    autoAllocateDivisions(totalStudentStrength, num);
  };

  const handleTotalStrengthChange = (val) => {
    const num = parseInt(val) || 0;
    setTotalStudentStrength(num);
    autoAllocateDivisions(num, allocatedClassroomsCount);
  };

  const handleClassroomsCountChange = (val) => {
    const maxRooms = Math.max(1, rooms.filter(r => r.roomType === 'lecture' || !r.roomType).length);
    const count = Math.max(1, Math.min(maxRooms, parseInt(val) || 1));
    setAllocatedClassroomsCount(count);
    autoAllocateDivisions(totalStudentStrength, count);
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
    if (!program) {
      alert('Please select a program (UG or PG) before generating.');
      return;
    }

    if (genMode === 'grouped') {
      const semsToGenerate = getGroupedSemesters();
      const unsaved = semsToGenerate.filter(s => !savedSemesters[s]);
      if (unsaved.length > 0) {
        alert(`Please save inputs semester by semester before generating.\nUnsaved semesters: ${unsaved.map(s => `Semester ${s}`).join(', ')}`);
        return;
      }
    }

    setLoading(true);
    setProgress(10);
    setResult(null);
    setIsSavedToDb(false);
    
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
        const semStartTime = allStartTimes[prioritySem] || (prioritySem === parseInt(config.semester) ? startTime : getDefaultStartTime(prioritySem));

        const res = await api.post('/timetables/generate-ml', {
          branch: config.branch,
          semester: prioritySem,
          facultyMapping: semMapping,
          divisions: semDivs,
          facultyMaxWorkloads,
          fixedTimings: semFixed,
          entryMode: isEntryModeSupported(prioritySem, program) ? (allEntryModes[prioritySem] || entryMode) : 'dynamic',
          program: program || 'UG',
          startTime: semStartTime
        });

        // Timetable is NOT automatically saved to MongoDB. User can preview and click "Save to Database".
        setProgress(100);
        setResult(res.data);
        setBySemesterResults({
          [prioritySem]: res.data.data
        });
        setPreviewSemester(prioritySem);
        setShowPreview(false);
        setActiveTab('division');
        setShowViewModal(true);
      } else {
        // Grouped Generation
        const semsToGenerate = getGroupedSemesters();
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
          const semStartTime = allStartTimes[semNum] || (semNum === parseInt(config.semester) ? startTime : getDefaultStartTime(semNum));

          // Provide previously generated in-memory schedules to backend for workload calculation
          const inMem = Object.entries(newBySemesterResults).map(([s, data]) => ({
            semester: parseInt(s, 10),
            rawSchedules: data.rawSchedules
          }));

          const res = await api.post('/timetables/generate-ml', {
            branch: config.branch,
            semester: semNum,
            facultyMapping: semMapping,
            divisions: semDivs,
            facultyMaxWorkloads,
            fixedTimings: semFixed,
            entryMode: isEntryModeSupported(semNum, program) ? (allEntryModes[semNum] || entryMode) : 'dynamic',
            program: program || 'UG',
            startTime: semStartTime,
            inMemoryTimetables: inMem
          });

          // In-memory collection only, not saved to MongoDB automatically
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
        setShowPreview(false);
        setActiveTab('division');
        setShowViewModal(true);
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
    const element = document.getElementById('timetable-preview-container') || document.getElementById('timetable-preview');
    if (!element) {
      alert('No timetable preview found to export.');
      return;
    }
    
    const opt = {
      margin:       0.4,
      filename:     `Timetable_${program || 'UG'}_Sem${previewSemester || config.semester}_${config.branch || 'CSE'}.pdf`,
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
    const teacher = faculties.find(f => f._id === facultyId);
    if (teacher && typeof teacher.maxWorkloadPerWeek === 'number' && teacher.maxWorkloadPerWeek > 0 && teacher.maxWorkloadPerWeek <= 24) {
      return teacher.maxWorkloadPerWeek;
    }

    if (!teacher) return 16;

    const name = (teacher.name || '').toLowerCase();
    const desig = (teacher.designation || '').toLowerCase();
    const roles = Array.isArray(teacher.extraRoles) ? teacher.extraRoles.map(r => String(r).toLowerCase()) : [];

    if (desig.includes('hod') || roles.some(r => r.includes('hod'))) return 12;
    if (desig.includes('dean') || roles.some(r => r.includes('dean'))) return 12;
    if (desig.includes('mic') || roles.some(r => r.includes('mic'))) return 14;
    if (desig.includes('naac') || roles.some(r => r.includes('naac'))) return 14;

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

  const isMathematicsOrChemistryForCSE = (sub) => {
    if (!sub) return false;
    const currentBranch = (config.branch || 'CSE').toUpperCase();
    if (currentBranch !== 'CSE') return false;

    const subNameLower = (sub.subjectName || '').toLowerCase();
    const subCodeLower = (sub.subjectCode || '').toLowerCase();
    const subDeptLower = (sub.department || '').toLowerCase();

    const isMath = subNameLower.includes('math') || subNameLower.includes('mats') || subCodeLower.includes('mat') || subCodeLower.includes('mac') || subDeptLower.includes('math') || subCodeLower.includes('ma1') || subCodeLower.includes('ma2');
    const isChemistry = subNameLower.includes('chemistry') || subNameLower.includes('chem') || subCodeLower.includes('che') || subDeptLower.includes('chemistry') || subDeptLower.includes('chem') || subCodeLower.includes('ch1');

    return isMath || isChemistry;
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
    if (!result?.data) {
      alert('No generated timetable data available to save. Please generate a timetable first.');
      return;
    }
    try {
      setSavingToDb(true);
      const semKeys = bySemesterResults ? Object.keys(bySemesterResults) : [];
      if (semKeys.length > 0) {
        for (const semStr of semKeys) {
          const semNum = parseInt(semStr, 10);
          const semData = bySemesterResults[semStr];
          if (semData && semData.rawSchedules && Object.keys(semData.rawSchedules).length > 0) {
            const semStartTime = allStartTimes[semNum] || (semNum === parseInt(config.semester) ? startTime : getDefaultStartTime(semNum));
            await api.post('/timetables/save-ml', {
              semester: semNum,
              branch: config.branch || 'CSE',
              rawSchedules: semData.rawSchedules,
              divisions: allDivisions[semNum] || divisions,
              program: program || 'UG',
              startTime: semStartTime
            });
          }
        }
      } else if (result.data.rawSchedules) {
        const targetSem = previewSemester || (cycle === 'odd' ? 1 : 2) || config.semester;
        const semStartTime = allStartTimes[targetSem] || (targetSem === parseInt(config.semester) ? startTime : getDefaultStartTime(targetSem));
        await api.post('/timetables/save-ml', {
          semester: targetSem,
          branch: config.branch || 'CSE',
          rawSchedules: result.data.rawSchedules,
          divisions: allDivisions[targetSem] || divisions,
          program: program || 'UG',
          startTime: semStartTime
        });
      }
      setIsSavedToDb(true);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to save timetables:', error);
      alert('Failed to save timetables: ' + (error.response?.data?.error || error.message));
    } finally {
      setSavingToDb(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* View Timetable Popup */}
      {showViewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full p-8 text-center relative animate-scale-up">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-green-600 shadow-inner">
              <FiCheckCircle size={44} />
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">
              Timetable Generated!
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Timetable generated successfully with 0 clashes. Click View to inspect the timetable before saving to database.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowViewModal(false);
                  setShowPreview(true);
                  setActiveTab('division');
                  setTimeout(() => {
                    const el = document.getElementById('engine-processing-results');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 50);
                }}
                className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FiCheckCircle size={18} /> View Timetable
              </button>
            </div>
          </div>
        </div>
      )}

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
                : (program === 'PG'
                    ? `Generate ${cycle === 'odd' ? '3rd' : '4th'} Semester`
                    : `Generate ${cycle === 'odd' ? '3rd, 5th & 7th' : '4th & 6th'} Semesters Together`)
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
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3.5 rounded-xl border border-indigo-100 space-y-3">
                <label className="block text-[11px] font-black text-indigo-900 uppercase tracking-wider">
                  1. Academic Cycle
                </label>

                {/* Program Selector: UG and PG */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider block">
                    Program Level
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleProgramChange('UG')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                        program === 'UG'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-extrabold text-sm">UG</span>
                      <span className="text-[9px] opacity-85">(Undergraduate)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProgramChange('PG')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                        program === 'PG'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-extrabold text-sm">PG</span>
                      <span className="text-[9px] opacity-85">(Postgraduate)</span>
                    </button>
                  </div>
                </div>

                {/* Odd/Even Selector - displayed only after UG or PG is selected */}
                {program ? (
                  <div className="space-y-1.5 pt-2 border-t border-indigo-100/70 animate-fade-in">
                    <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider block">
                      Academic Semester Cycle
                    </span>
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
                        <span className="text-[9px] opacity-85">
                          {program === 'PG' ? '(1st, 3rd)' : '(1st, 3rd, 5th, 7th)'}
                        </span>
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
                        <span className="text-[9px] opacity-85">
                          {program === 'PG' ? '(2nd, 4th)' : '(2nd, 4th, 6th)'}
                        </span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white/70 rounded-xl border border-dashed border-indigo-200 text-center">
                    <p className="text-[11px] text-indigo-700 font-semibold">
                      Please select UG or PG above to choose an academic cycle.
                    </p>
                  </div>
                )}
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
                    Grouped ({program === 'PG' ? (cycle === 'odd' ? '3rd Sem' : '4th Sem') : (cycle === 'odd' ? '3rd, 5th, 7th' : '4th, 6th')})
                  </button>
                </div>
              </div>

              {/* Grouped Semester Selector Pill Tabs */}
              {genMode === 'grouped' && (
                <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-indigo-900 uppercase flex justify-between items-center">
                    <span>Map Inputs Semester by Semester:</span>
                    <span className="text-[10px] text-indigo-600 font-bold">
                      (Saved {getGroupedSemesters().filter(s => savedSemesters[s]).length}/{getGroupedSemesters().length})
                    </span>
                  </label>
                  <div className="flex gap-2">
                    {getGroupedSemesters().map(semNum => (
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
                  {getAllSemestersForCycle().map(s => (
                    <option key={s} value={s}>Semester {s} {s === (cycle === 'odd' ? 1 : 2) ? '(Priority)' : '(Grouped)'}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider">
                    Automatic Division & Room Allocation
                  </label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {program || 'UG'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Total Student Strength</label>
                    <input 
                      type="number"
                      min="1"
                      value={totalStudentStrength}
                      onChange={(e) => handleTotalStrengthChange(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. 60"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-1">
                      Available Classrooms ({rooms.filter(r => r.roomType === 'lecture' || !r.roomType).length})
                    </label>
                    <input 
                      type="number"
                      min="1"
                      max={Math.max(1, rooms.filter(r => r.roomType === 'lecture' || !r.roomType).length)}
                      value={allocatedClassroomsCount}
                      onChange={(e) => handleClassroomsCountChange(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-gray-500">
                    Evenly distributes {totalStudentStrength} students across {divisions.length} division{divisions.length > 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => autoAllocateDivisions(totalStudentStrength, allocatedClassroomsCount)}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Auto-Calculate
                  </button>
                </div>

                {divisions.length > 0 && (
                  <div className="space-y-2 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                      <span>Allocated Divisions ({divisions.length})</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        divisions.reduce((a, b) => a + (parseInt(b.strength) || 0), 0) === parseInt(totalStudentStrength)
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        Sum: {divisions.reduce((a, b) => a + (parseInt(b.strength) || 0), 0)} / {totalStudentStrength}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {divisions.map((div, idx) => (
                        <div key={idx} className="bg-white p-2.5 rounded-lg border border-indigo-100 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {div.name}
                            </span>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                value={div.strength}
                                onChange={(e) => handleStrengthChange(idx, e.target.value)}
                                className="w-14 p-1 bg-gray-50 border border-gray-200 rounded text-xs font-bold text-center outline-none focus:border-indigo-500"
                              />
                              <span className="text-[10px] text-gray-400 font-medium">students</span>
                            </div>
                          </div>
                          <div className="text-[11px] text-gray-600 font-semibold flex items-center gap-1">
                            <span>Room:</span>
                            <span className="font-extrabold text-indigo-950 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                              {div.assignedRoom}
                            </span>
                            {div.roomCapacity && (
                              <span className="text-[9px] text-gray-400">(Cap: {div.roomCapacity})</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
          </div>

          {/* Subjects Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-2xl shadow-sm border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-800 uppercase mb-3 flex items-center">
              <FiBookOpen className="mr-2" /> Semester Overview
            </h3>
            <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-xs border border-indigo-100/60">
              <span className="text-xs font-bold text-gray-500">Total Subjects</span>
              <div className="text-xl font-bold text-indigo-900">{subjects.length}</div>
            </div>
          </div>

          {/* Subject Timings & Constraints */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                <FiClock className="text-indigo-600" />
                Subject Timings & Constraints
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {isEntryModeSupported(config.semester, program) && (
                  entryMode === 'dynamic'
                    ? (program === 'PG'
                        ? "Dynamic Entry: Subjects are scheduled automatically by AI. Configure custom slots below if needed."
                        : "Dynamic Entry: Day & Time slots are active for Mathematics & Chemistry only (CSE). Configure other custom slots below if needed.")
                    : "Static Entry: Set day & time slots beside each subject in the Map Faculty section, or configure custom slot timings below."
                )}
                {program !== 'PG' && (config.semester == 5) && "Set timing for Program Elective (applied across all divisions)."}
                {program !== 'PG' && (config.semester == 6 || config.semester == 7) && "Set timings for Program Elective & Open Elective (applied across all divisions)."}
                {(!isEntryModeSupported(config.semester, program) && ![5, 6, 7].includes(parseInt(config.semester))) && "Force specific subjects to be scheduled at an exact day and time."}
              </p>
            </div>

            {/* Sem 5 Elective Timing (Dynamic Inputs based on Credits) */}
            {(parseInt(config.semester) === 5) && (
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                <div className="flex justify-between items-center mb-2.5 border-b border-indigo-100 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900">Program Elective Timing</h4>
                    <p className="text-[10px] text-indigo-600">Applied to all divisions</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-xs">
                    <label className="text-[10px] font-bold text-indigo-900">Credits:</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="6" 
                      value={peCredits}
                      onChange={e => handleElectiveCreditsChange('pe', parseInt(e.target.value) || 1)}
                      className="w-8 p-0.5 bg-indigo-50 border border-indigo-300 rounded text-xs text-center font-bold text-indigo-900 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: peCredits }).map((_, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-indigo-600 font-bold w-12 shrink-0">Slot {idx + 1}</span>
                      <select 
                        className="w-1/2 min-w-0 p-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none font-medium text-gray-700 focus:border-indigo-500"
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
                        className="w-1/2 min-w-0 p-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none font-medium text-gray-700 focus:border-indigo-500"
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
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 border-b border-indigo-100 pb-2">Elective Timings (All Divisions)</h4>
                
                {/* Open Elective */}
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs space-y-2">
                  <div className="flex justify-between items-center mb-1 border-b border-indigo-50 pb-1.5">
                    <h5 className="text-[11px] font-bold text-indigo-800">Open Elective</h5>
                    <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      <label className="text-[10px] font-bold text-indigo-900">Credits:</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="6" 
                        value={oeCredits}
                        onChange={e => handleElectiveCreditsChange('oe', parseInt(e.target.value) || 1)}
                        className="w-8 p-0.5 bg-white border border-indigo-300 rounded text-xs text-center font-bold text-indigo-900 outline-none"
                      />
                    </div>
                  </div>
                  {Array.from({ length: oeCredits }).map((_, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-gray-500 font-bold w-12 shrink-0">Slot {idx + 1}</span>
                      <select 
                        className="w-1/2 min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs outline-none font-medium text-gray-700 focus:border-indigo-500"
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
                        className="w-1/2 min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs outline-none font-medium text-gray-700 focus:border-indigo-500"
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
                <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-xs space-y-2">
                  <div className="flex justify-between items-center mb-1 border-b border-indigo-50 pb-1.5">
                    <h5 className="text-[11px] font-bold text-indigo-800">Program Elective</h5>
                    <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      <label className="text-[10px] font-bold text-indigo-900">Credits:</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="6" 
                        value={peCredits}
                        onChange={e => handleElectiveCreditsChange('pe', parseInt(e.target.value) || 1)}
                        className="w-8 p-0.5 bg-white border border-indigo-300 rounded text-xs text-center font-bold text-indigo-900 outline-none"
                      />
                    </div>
                  </div>
                  {Array.from({ length: peCredits }).map((_, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-gray-500 font-bold w-12 shrink-0">Slot {idx + 1}</span>
                      <select 
                        className="w-1/2 min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs outline-none font-medium text-gray-700 focus:border-indigo-500"
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
                        className="w-1/2 min-w-0 p-1.5 bg-white border border-gray-200 rounded text-xs outline-none font-medium text-gray-700 focus:border-indigo-500"
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

            {/* Custom Slot Timings per Division */}
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider mb-2.5">
                Custom Slot Timings per Division
              </h4>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Target Division</label>
                  <select 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={selectedFixDiv} 
                    onChange={e => setSelectedFixDiv(e.target.value)}
                  >
                    <option value="ALL">All Divisions</option>
                    {divisions.map(d => <option key={d.name} value={d.name}>{d.name} Only</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Subject</label>
                  <select 
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:border-indigo-500 focus:bg-white transition-all truncate"
                    value={selectedFixSub} 
                    onChange={e => setSelectedFixSub(e.target.value)}
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.subjectCode ? `${s.subjectCode} - ` : ''}{s.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Day & Time Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      className="w-full min-w-0 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      value={selectedFixDay} 
                      onChange={e => setSelectedFixDay(e.target.value)}
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
                      className="w-full min-w-0 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      value={selectedFixTime} 
                      onChange={e => setSelectedFixTime(e.target.value)}
                    >
                      <option value="">Select Time</option>
                      <option value="N/A">N/A</option>
                      {["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={addFixedTiming} 
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <FiClock /> Add Division Slot Timing
                </button>
              </div>
            </div>
            
            {/* Active configured slots list */}
            <div className="space-y-1.5 pt-2">
              {divisions.map(div => {
                const divTimings = fixedTimings[div.name] || {};
                return Object.keys(divTimings).map(subId => {
                  const validSlots = (divTimings[subId] || []).filter(t => t.day && t.day !== 'N/A' && t.time && t.time !== 'N/A');
                  if (validSlots.length === 0) return null;
                  const subName = subjects.find(s => s._id === subId)?.subjectName || 'Subject';
                  return (
                    <div 
                      key={`${div.name}-${subId}`} 
                      className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200 flex justify-between items-start gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-indigo-900 font-bold truncate">[{div.name}] {subName}</p> 
                        <p className="font-medium text-gray-500 text-[11px] break-words mt-0.5">
                          {validSlots.map(t => `${t.day} @ ${t.time}`).join(' • ')}
                        </p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setFixedTimings(prev => {
                            const updated = { ...prev };
                            if (updated[div.name]) {
                              delete updated[div.name][subId];
                            }
                            return updated;
                          });
                        }} 
                        className="text-gray-400 hover:text-red-600 font-bold p-1 shrink-0 transition-colors"
                        title="Remove"
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
             <div id="engine-processing-results" className="space-y-6 animate-slide-up">
              <div className="bg-green-50 border border-green-200 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-green-800 flex items-center">
                    <FiCheckCircle className="mr-2" /> Timetable Generated Successfully
                  </h3>
                  <p className="text-sm text-green-600 mt-1">
                    {isSavedToDb 
                      ? '✓ 100% constraints satisfied. Saved to MongoDB database.' 
                      : '100% constraints satisfied. Displaying in-memory preview. Click "Save to Database" when ready.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={handleSaveTimetables} 
                    disabled={savingToDb || isSavedToDb}
                    className={`${
                      isSavedToDb 
                        ? 'bg-green-700 text-white cursor-default' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                    } px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                      savingToDb ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    <FiCheckCircle /> {savingToDb ? 'Saving to Database...' : isSavedToDb ? 'Saved to Database' : 'Save to Database'}
                  </button>
                  <button 
                    onClick={handleExportPDF} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                  >
                    <FiDownload /> Export PDF
                  </button>
                  <button 
                    onClick={() => setShowPreview(!showPreview)} 
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
              </div>

              {/* View Selection: Division View Only */}
              <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                <button 
                  type="button"
                  onClick={() => setActiveTab('division')}
                  className="w-full py-2 text-xs font-extrabold rounded-lg bg-white shadow-xs text-indigo-700 cursor-default"
                >
                  Division View
                </button>
              </div>

              {/* Semester Selector Bar for Preview */}
              {genMode === 'grouped' && (
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">Select Semester Timetable:</span>
                    <div className="flex gap-2">
                      {getGroupedSemesters().map(semNum => (
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

                return (
                  <div id="timetable-preview-container" className="space-y-8">
                    {Object.keys(currentMatrix).map(divId => {
                  const division = currentMatrix[divId];
                  const days = Object.keys(division.days);
                  const semDivs = allDivisions[previewSemester] || divisions;
                  const divInfo = semDivs.find(d => d.name === division.divisionName || d.name === divId) || division;
                  const displayStrength = divInfo.strength || division.strength || (program === 'PG' ? 30 : 60);
                  const displayRoom = divInfo.assignedRoom || division.assignedRoom || 'Room Assigned';
                  const roomCap = divInfo.roomCapacity || division.roomCapacity;

                  return (
                    <div key={divId} id="timetable-preview" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-x-auto mb-8 last:mb-0">
                      {/* Timetable Header with Division & Student Count in the Left Corner */}
                      <div className="mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/90 pb-4">
                        {/* LEFT CORNER: Division Name, Student Count & Allocated Room */}
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 text-white px-4 py-2.5 rounded-xl shadow-xs text-center min-w-[100px] border border-indigo-900">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200 block">Division</span>
                            <span className="text-2xl font-black">{division.divisionName || divId}</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="bg-indigo-50 text-indigo-800 text-xs font-black px-3 py-1 rounded-full border border-indigo-200 shadow-2xs">
                                👥 {displayStrength} Students
                              </span>
                              <span className="bg-purple-50 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full border border-purple-200">
                                {program || 'UG'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-700 font-semibold flex items-center gap-1.5 flex-wrap">
                              <span className="text-gray-500">Allocated Room:</span>
                              <span className="font-extrabold text-indigo-950 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-300">
                                🏢 {displayRoom}
                              </span>
                              {roomCap && (
                                <span className="text-[11px] text-gray-500 font-medium">(Capacity: {roomCap})</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Center / Right: College Title & Academic Semester */}
                        <div className="text-left md:text-right">
                          <h2 className="text-xl font-black text-gray-800 tracking-tight">Class Timetable - {config.branch} Sem {previewSemester}</h2>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">Department of Computer Science & Engineering • Academic Year 2024-25</p>
                        </div>
                      </div>

                      {(() => {
                        const divHas1230 = Object.values(division.days || {}).some(dayObj => dayObj && dayObj["12:30"] && dayObj["12:30"].type !== "busy");
                        const divHas0800 = Object.values(division.days || {}).some(dayObj => dayObj && dayObj["08:00"] && dayObj["08:00"].type !== "busy");
                        const effectiveDivStartTime = division.collegeStartTime || allStartTimes[previewSemester] || (previewSemester === parseInt(config.semester) ? startTime : getDefaultStartTime(previewSemester));
                        const is8amStart = effectiveDivStartTime === '08:00' || divHas0800;

                        return (
                          <>
                            <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                              <thead>
                                <tr>
                                  <th className="border border-gray-400 p-2 bg-indigo-50/80 font-bold text-gray-700 text-center w-28">
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs font-black text-indigo-900">{division.divisionName || divId}</span>
                                      <span className="text-[10px] font-bold text-indigo-600 bg-white px-1.5 py-0.5 rounded border border-indigo-200 shadow-2xs my-0.5">
                                        {displayStrength} Students
                                      </span>
                                      <span className="text-[9px] font-extrabold text-gray-500 uppercase">Day \ Time</span>
                                    </div>
                                  </th>
                                  {is8amStart && (
                                    <th className="border border-gray-400 p-2 bg-white font-bold text-center"><div className="flex flex-col"><span>8:00 to</span><span>9:00 AM</span></div></th>
                                  )}
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
                                    ...(is8amStart ? [{ time: '08:00', type: 'class' }] : []),
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
            })}
          </div>
        );
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
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <FiUsers className="mr-2 text-indigo-500" /> Map Faculty to Subjects
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Assign faculty for each division independently.</p>
                </div>

                {/* Class Start-Time Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs self-start md:self-auto">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-gray-700">
                    <FiClock className="text-indigo-600" />
                    <span>Class Start Time:</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      id="start-time-8am-btn"
                      onClick={() => handleStartTimeChange('08:00')}
                      className={`py-1.5 px-3 rounded-md text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                        startTime === '08:00'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                      }`}
                    >
                      8:00 AM
                      {getDefaultStartTime(config.semester) === '08:00' && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          startTime === '08:00' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-200 text-gray-600'
                        }`}>
                          Default
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      id="start-time-9am-btn"
                      onClick={() => handleStartTimeChange('09:00')}
                      className={`py-1.5 px-3 rounded-md text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                        startTime === '09:00'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                      }`}
                    >
                      9:00 AM
                      {getDefaultStartTime(config.semester) === '09:00' && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          startTime === '09:00' ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-200 text-gray-600'
                        }`}>
                          Default
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {subjects.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-gray-400">No subjects found for Semester {config.semester} {config.branch}.</p>
                </div>
              ) : (
                <div className="p-6">
                  {/* Timetable Entry Mode Toggle (Supported for UG Sem 1 & 2; PG Sem 1, 2, 3, 4) */}
                  {isEntryModeSupported(config.semester, program) && (
                    <div className="mb-6 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 p-4 rounded-2xl border border-indigo-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">Timetable Entry Mode</label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${entryMode === 'dynamic' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {entryMode === 'dynamic' ? 'Dynamic Entry Active' : 'Static Entry Active'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1">
                          {entryMode === 'dynamic' 
                            ? (program === 'PG'
                                ? 'Dynamic Entry: Subjects and labs are scheduled automatically by AI. Switch to Static Entry to pin custom day and time slots.'
                                : 'Dynamic Entry: Day and Time dropdowns enabled for Mathematics and Chemistry for CSE only. Other subjects are scheduled automatically.')
                            : 'Static Entry: Day and Time dropdowns enabled for every subject for strict manual schedule entry.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0 self-start md:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEntryModeChange('dynamic')}
                          className={`py-2 px-3.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                            entryMode === 'dynamic'
                              ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <FiCpu className="text-indigo-500" /> Dynamic Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEntryModeChange('static')}
                          className={`py-2 px-3.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                            entryMode === 'static'
                              ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          <FiCheckCircle className="text-indigo-500" /> Static Entry
                        </button>
                      </div>
                    </div>
                  )}

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

                              {/* Day + Time Dropdowns for Supported Semesters */}
                              {isEntryModeSupported(config.semester, program) && 
                               (entryMode === 'static' || (program !== 'PG' && isMathematicsOrChemistryForCSE(sub))) && (() => {
                                const slotCount = Math.max(1, sub.credits || ((sub.lectureHours || 0) + (sub.tutorialHours || 0)) || 1);
                                return (
                                  <div className="mt-4 pt-3 border-t border-gray-200/80 bg-white/60 -mx-5 -mb-5 p-4 rounded-b-xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                                      <label className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                                        <FiClock className="text-indigo-600" /> Day & Time Slots ({slotCount} slot{slotCount > 1 ? 's' : ''} • {sub.credits || slotCount} Credit{slotCount > 1 ? 's' : ''})
                                      </label>
                                      <span className="text-[10px] text-gray-500 font-medium">
                                        {entryMode === 'static' ? '• Fixed timings for Static Entry' : '• Optional fixed timings for Dynamic Entry (Math/Chem)'}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                      {Array.from({ length: slotCount }).map((_, i) => (
                                        <div key={i} className="bg-white p-2 rounded-lg border border-indigo-100 shadow-xs flex flex-col gap-1.5">
                                          <span className="text-[10px] font-bold text-gray-600">Slot {i + 1}</span>
                                          <div className="flex gap-1.5">
                                            <select
                                              className="w-1/2 p-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium outline-none focus:border-indigo-500 text-gray-800"
                                              value={fixedTimings[div.name]?.[sub._id]?.[i]?.day || ''}
                                              onChange={e => handleFixedTimingChange(div.name, sub._id, i, 'day', e.target.value)}
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
                                              className="w-1/2 p-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-medium outline-none focus:border-indigo-500 text-gray-800"
                                              value={fixedTimings[div.name]?.[sub._id]?.[i]?.time || ''}
                                              onChange={e => handleFixedTimingChange(div.name, sub._id, i, 'time', e.target.value)}
                                            >
                                              <option value="">Time</option>
                                              <option value="N/A">N/A</option>
                                              {Array.from(new Set([
                                                ...(startTime === '08:00'
                                                  ? ["08:00", "09:00", "10:30", "11:30", "14:30", "15:30"]
                                                  : ["09:00", "10:30", "11:30", "12:30", "14:30", "15:30"]),
                                                ...(fixedTimings[div.name]?.[sub._id]?.[i]?.time ? [fixedTimings[div.name][sub._id][i].time] : [])
                                              ])).sort().map(t => (
                                                <option key={t} value={t}>{t}</option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
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
