import main

def test_generation_for_sem(sem):
    print(f"\n--- Testing ML Timetable Generation for Semester {sem} ---")
    subjects = [
        {"_id": f"sub_{sem}_1", "subjectName": "Core Subject 1", "subjectCode": f"CS{sem}01", "lectureHours": 3, "tutorialHours": 1, "practicalHours": 0, "semester": sem},
        {"_id": f"sub_{sem}_2", "subjectName": "Core Subject 2", "subjectCode": f"CS{sem}02", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "semester": sem},
        {"_id": f"sub_{sem}_3", "subjectName": "Core Subject 3", "subjectCode": f"CS{sem}03", "lectureHours": 3, "tutorialHours": 0, "practicalHours": 0, "semester": sem},
        {"_id": f"sub_{sem}_4", "subjectName": "Core Lab", "subjectCode": f"CS{sem}04L", "lectureHours": 0, "tutorialHours": 0, "practicalHours": 2, "semester": sem},
    ]
    teachers = [
        {"_id": f"t_{i}", "name": f"Faculty {i}", "maxWorkloadPerWeek": 20.0, "currentWorkload": 0.0} for i in range(1, 6)
    ]
    rooms = [
        {"_id": "r_101", "roomNumber": "101", "roomType": "lecture", "capacity": 60}
    ]
    labsConfig = [
        {"id": 1, "name": "Lab 1", "capacity": 30},
        {"id": 2, "name": "Lab 2", "capacity": 30}
    ]
    
    req = main.GenerationRequest(
        subjects=subjects,
        teachers=teachers,
        rooms=rooms,
        constraints={},
        facultyMapping={},
        divisions=[{"name": "DIV-A", "strength": 60}],
        semester=sem,
        branch="CSE",
        labsConfig=labsConfig
    )
    
    res = main.generate_timetable(req)
    print("Status:", res.get("status"))
    print("Message:", res.get("message"))
    
    matrix = res.get("matrix", {}).get("DIV-A", {}).get("days", {})
    used_1230 = False
    used_0800 = False
    for day, slots in matrix.items():
        if slots.get("08:00") is not None:
            used_0800 = True
        if slots.get("12:30") is not None:
            used_1230 = True
            
    print(f"Result for Sem {sem}: 08:00 used = {used_0800}, 12:30 used = {used_1230}")

test_generation_for_sem(1) # 8 AM start
test_generation_for_sem(5) # 8 AM start
test_generation_for_sem(3) # 9 AM start
test_generation_for_sem(6) # 9 AM start
