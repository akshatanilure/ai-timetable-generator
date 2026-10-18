import main

def test_elective_scheduling():
    print("=== Testing Elective Group Scheduling ===")
    
    subjects = [
        # Compulsory subjects
        {"_id": "comp_1", "subjectName": "Computer Networks", "subjectCode": "CS501", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Compulsory Subject", "semester": 5},
        {"_id": "comp_2", "subjectName": "Operating Systems", "subjectCode": "CS502", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Compulsory Subject", "semester": 5},
        # Elective 1 group (2 parallel subjects)
        {"_id": "elec_1a", "subjectName": "Cloud Computing", "subjectCode": "CS503A", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Elective 1", "semester": 5},
        {"_id": "elec_1b", "subjectName": "Grid Computing", "subjectCode": "CS503B", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Elective 1", "semester": 5},
        # Elective 2 group (3 parallel subjects)
        {"_id": "elec_2a", "subjectName": "Machine Learning", "subjectCode": "CS504A", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Elective 2", "semester": 5},
        {"_id": "elec_2b", "subjectName": "Deep Learning", "subjectCode": "CS504B", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Elective 2", "semester": 5},
        {"_id": "elec_2c", "subjectName": "Data Mining", "subjectCode": "CS504C", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Elective 2", "semester": 5},
        # Elective 3 group (2 parallel subjects)
        {"_id": "elec_3a", "subjectName": "Cyber Security", "subjectCode": "CS505A", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Elective 3", "semester": 5},
        {"_id": "elec_3b", "subjectName": "Ethical Hacking", "subjectCode": "CS505B", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "subjectCategory": "Elective 3", "semester": 5},
    ]

    teachers = [
        {"_id": f"t_{i}", "name": f"Faculty {i}", "maxWorkloadPerWeek": 24.0, "currentWorkload": 0.0} for i in range(1, 15)
    ]

    rooms = [
        {"_id": f"r_{i}", "roomNumber": f"10{i}", "roomType": "lecture", "capacity": 60} for i in range(1, 10)
    ]

    req = main.GenerationRequest(
        subjects=subjects,
        teachers=teachers,
        rooms=rooms,
        constraints={},
        facultyMapping={},
        divisions=[{"name": "DIV-A", "strength": 60}],
        semester=5,
        branch="CSE",
        labsConfig=[]
    )

    res = main.generate_timetable(req)
    assert res.get("status") == "success", f"Generation failed: {res}"
    print(f"Generation successful: {res.get('message')}")

    raw_schedules = res.get("rawSchedules", {}).get("DIV-A", [])
    
    # Group scheduled slots by subject ID
    sub_slots = {}
    for entry in raw_schedules:
        s_id = entry["subject"]["_id"]
        slot_key = (entry["day"], entry["startTime"])
        if s_id not in sub_slots:
            sub_slots[s_id] = set()
        sub_slots[s_id].add(slot_key)

    # 1. Verify Elective 1 subjects (elec_1a, elec_1b) are scheduled AT THE SAME TIME
    e1a_slots = sub_slots.get("elec_1a", set())
    e1b_slots = sub_slots.get("elec_1b", set())
    print("Elective 1A slots:", e1a_slots)
    print("Elective 1B slots:", e1b_slots)
    assert e1a_slots == e1b_slots, "Elective 1A and 1B must be scheduled at the exact same time slots!"
    assert len(e1a_slots) == 3, f"Elective 1 should have 3 lecture hours scheduled, got {len(e1a_slots)}"

    # 2. Verify Elective 2 subjects (elec_2a, elec_2b, elec_2c) are scheduled AT THE SAME TIME
    e2a_slots = sub_slots.get("elec_2a", set())
    e2b_slots = sub_slots.get("elec_2b", set())
    e2c_slots = sub_slots.get("elec_2c", set())
    print("Elective 2A slots:", e2a_slots)
    print("Elective 2B slots:", e2b_slots)
    print("Elective 2C slots:", e2c_slots)
    assert e2a_slots == e2b_slots == e2c_slots, "Elective 2 subjects must be scheduled at the exact same time slots!"
    assert len(e2a_slots) == 3, f"Elective 2 should have 3 lecture hours scheduled, got {len(e2a_slots)}"

    # 3. Verify Elective 3 subjects (elec_3a, elec_3b) are scheduled AT THE SAME TIME
    e3a_slots = sub_slots.get("elec_3a", set())
    e3b_slots = sub_slots.get("elec_3b", set())
    print("Elective 3A slots:", e3a_slots)
    print("Elective 3B slots:", e3b_slots)
    assert e3a_slots == e3b_slots, "Elective 3 subjects must be scheduled at the exact same time slots!"
    assert len(e3a_slots) == 3, f"Elective 3 should have 3 lecture hours scheduled, got {len(e3a_slots)}"

    # 4. Verify different elective groups DO NOT OVERLAP
    overlap_1_2 = e1a_slots.intersection(e2a_slots)
    overlap_1_3 = e1a_slots.intersection(e3a_slots)
    overlap_2_3 = e2a_slots.intersection(e3a_slots)
    print("Overlap E1 and E2:", overlap_1_2)
    print("Overlap E1 and E3:", overlap_1_3)
    print("Overlap E2 and E3:", overlap_2_3)
    assert len(overlap_1_2) == 0, f"Elective 1 and Elective 2 must not overlap! Found {overlap_1_2}"
    assert len(overlap_1_3) == 0, f"Elective 1 and Elective 3 must not overlap! Found {overlap_1_3}"
    assert len(overlap_2_3) == 0, f"Elective 2 and Elective 3 must not overlap! Found {overlap_2_3}"

    # 5. Verify compulsory subjects do not overlap with any elective slots or each other
    comp1_slots = sub_slots.get("comp_1", set())
    comp2_slots = sub_slots.get("comp_2", set())
    print("Compulsory 1 slots:", comp1_slots)
    print("Compulsory 2 slots:", comp2_slots)
    assert len(comp1_slots.intersection(comp2_slots)) == 0, "Compulsory 1 and 2 must not overlap!"
    assert len(comp1_slots.intersection(e1a_slots)) == 0, "Compulsory 1 must not overlap with Elective 1!"
    assert len(comp1_slots.intersection(e2a_slots)) == 0, "Compulsory 1 must not overlap with Elective 2!"
    assert len(comp2_slots.intersection(e1a_slots)) == 0, "Compulsory 2 must not overlap with Elective 1!"

    print("\nALL ASSERTIONS PASSED! Elective groups are scheduled synchronously within group, and strictly non-overlapping across groups and compulsory subjects.")

if __name__ == "__main__":
    test_elective_scheduling()
