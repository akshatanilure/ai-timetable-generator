import random
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

app = FastAPI(title="AI Timetable ML Engine")

class GenerationRequest(BaseModel):
    subjects: List[Dict[str, Any]]
    teachers: List[Dict[str, Any]]
    rooms: List[Dict[str, Any]]
    constraints: Dict[str, Any]
    facultyMapping: Dict[str, Any]
    divisions: Optional[List[Dict[str, Any]]] = [{"name": "DIV-A", "strength": 72}]
    facultyMaxWorkloads: Dict[str, float] = {}
    fixedTimings: Dict[str, Dict[str, List[Dict[str, str]]]] = {}
    semester: int = 1
    branch: str = "CSE"
    labsConfig: List[Dict[str, Any]] = [{"id": 1, "capacity": 30}, {"id": 2, "capacity": 30}]

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
SLOTS = ["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30", "16:30"]

MAX_DAILY_WORKING_HOURS = 5
VALID_LAB_START_INDICES = [0, 2, 3, 5] # Removed 6 so labs end at 4:30
SATURDAY_VALID_INDICES = [0, 1, 2, 3] 

def create_individual(sessions, teachers, faculty_mapping, rooms, fixed_timings, global_start_idx=0):
    timetable = []
    
    div_names = list(set(s.get('division', 'DIV-A') for s in sessions))
    divisions = [{'name': d} for d in div_names]
    
    div_start_indices = {d: global_start_idx for d in div_names}

    
    # 1. Randomly 1, 2 or 3 days full day
    full_days_per_div = {}
    for div in div_names:
        num_full = random.choice([1, 2, 3])
        full_days_per_div[div] = set(random.sample(DAYS[:-1], num_full))
        
    occupied = {div['name']: set() for div in divisions}
    labs_per_day = {div['name']: {day: 0 for day in DAYS} for div in divisions}
    used_fixed = {div['name']: {} for div in divisions}
    reserved_fixed = {div['name']: set() for div in divisions}
    
    for div_name, sub_timings in fixed_timings.items():
        if div_name not in reserved_fixed: continue
        for sub_id, slots in sub_timings.items():
            is_minor = False
            for s in sessions:
                if s.get('type') == 'theory' and 'subject' in s:
                    if str(s['subject'].get('_id')) == sub_id:
                        if 'minor' in s['subject'].get('subjectName', '').lower():
                            is_minor = True
                            break
            for f_slot in slots:
                f_day = f_slot.get('day', '')
                f_time = f_slot.get('time', '')
                if f_day and f_time in SLOTS:
                    f_idx = SLOTS.index(f_time)
                    if f_day == 'Saturday' and f_idx not in SATURDAY_VALID_INDICES: continue
                    reserved_fixed[div_name].add((f_day, f_idx))
                    if is_minor:
                        reserved_fixed[div_name].add((f_day, f_idx + 1))

    theories = [s for s in sessions if s['type'] == 'theory']
    labs = [s for s in sessions if s['type'] == 'lab_group']
    
    # Place Labs
    for session in labs:
        placed = False
        div_name = session.get('division', 'DIV-A')
        
        lab_slots = []
        for d in DAYS:
            if d == 'Saturday': continue
            for idx in VALID_LAB_START_INDICES:
                start_idx = div_start_indices.get(div_name, 0)
                if idx >= start_idx:
                    if idx + 1 > 4 and d not in full_days_per_div[div_name]:
                        continue
                    lab_slots.append((d, idx))
        random.shuffle(lab_slots)
        
        for (day, slot_idx) in lab_slots:
            if labs_per_day[div_name][day] == 0:
                if (day, slot_idx) not in occupied[div_name] and (day, slot_idx + 1) not in occupied[div_name]:
                    if (day, slot_idx) not in reserved_fixed[div_name] and (day, slot_idx + 1) not in reserved_fixed[div_name]:
                        occupied[div_name].add((day, slot_idx))
                        occupied[div_name].add((day, slot_idx + 1))
                        labs_per_day[div_name][day] += 1
                        
                        group_teachers = []
                        group_rooms = []
                        for sub_session in session['sessions']:
                            sub_id = str(sub_session['subject'].get('_id'))
                            fac_map = faculty_mapping.get(div_name, {}).get(sub_id, faculty_mapping.get(sub_id, {}))
                            facs = [t for t in teachers if str(t.get('_id')) in fac_map.get('lab', [])]
                            if len(facs) == 0: facs = [random.choice(teachers)]
                            group_teachers.append(facs[0])
                            group_rooms.append(random.choice(rooms))
                            
                        timetable.append({"session": session, "day": day, "slot_idx": slot_idx, "teacher": group_teachers, "room": group_rooms})
                        placed = True
                        break
        if not placed:
            for (day, slot_idx) in lab_slots:
                if (day, slot_idx) not in occupied[div_name] and (day, slot_idx + 1) not in occupied[div_name]:
                    if (day, slot_idx) not in reserved_fixed[div_name] and (day, slot_idx + 1) not in reserved_fixed[div_name]:
                        occupied[div_name].add((day, slot_idx))
                        occupied[div_name].add((day, slot_idx + 1))
                        labs_per_day[div_name][day] += 1
                        group_teachers = []
                        group_rooms = []
                        for sub_session in session['sessions']:
                            sub_id = str(sub_session['subject'].get('_id'))
                            fac_map = faculty_mapping.get(div_name, {}).get(sub_id, faculty_mapping.get(sub_id, {}))
                            facs = [t for t in teachers if str(t.get('_id')) in fac_map.get('lab', [])]
                            if len(facs) == 0: facs = [random.choice(teachers)]
                            group_teachers.append(facs[0])
                            
                            # Use physical lab if assigned, else random room
                            if 'assigned_lab' in sub_session:
                                # Create a fake room object for the frontend to render the physical lab name
                                lab_room = {"_id": f"lab_{sub_session['assigned_lab'].get('id', 'temp')}", "roomNumber": f"{sub_session['assigned_lab'].get('name', 'Lab')} {sub_session['assigned_lab'].get('id', '')}".strip()}
                                group_rooms.append(lab_room)
                            else:
                                group_rooms.append(random.choice(rooms))
                                
                        timetable.append({"session": session, "day": day, "slot_idx": slot_idx, "teacher": group_teachers, "room": group_rooms})
                        placed = True
                        break

    non_fixed_theories = []
    for session in theories:
        div_name = session.get('division', 'DIV-A')
        sub_name = session['subject'].get('subjectName', '').lower()
        sub_id = str(session['subject'].get('_id'))
        
        placed = False
        div_fixed_timings = fixed_timings.get(div_name, {})
        if sub_id in div_fixed_timings and used_fixed[div_name].get(sub_id, 0) < len(div_fixed_timings[sub_id]):
            f_slot = div_fixed_timings[sub_id][used_fixed[div_name].get(sub_id, 0)]
            used_fixed[div_name][sub_id] = used_fixed[div_name].get(sub_id, 0) + 1
            f_day = f_slot.get('day', '')
            f_time = f_slot.get('time', '')
            if f_day and f_time in SLOTS:
                f_idx = SLOTS.index(f_time)
                
                # Check for minor subject with duration 2
                duration = session.get('duration', 1)
                
                can_place = True
                for offset in range(duration):
                    chk_idx = f_idx + offset
                    if chk_idx >= len(SLOTS):
                        can_place = False
                        break
                    if f_day == 'Saturday' and chk_idx not in SATURDAY_VALID_INDICES:
                        can_place = False
                        break
                    if (f_day, chk_idx) in occupied[div_name]:
                        can_place = False
                        break
                
                if can_place:
                    for offset in range(duration):
                        occupied[div_name].add((f_day, f_idx + offset))
                    
                    fac_map = faculty_mapping.get(div_name, {}).get(sub_id, faculty_mapping.get(sub_id, {}))
                    th_fac = fac_map.get('theory', '')
                    facs = [t for t in teachers if str(t.get('_id')) == th_fac]
                    if len(facs) == 0: facs = [random.choice(teachers)]
                    
                    sess_copy = dict(session)
                    sess_copy['duration'] = duration
                    timetable.append({"session": sess_copy, "day": f_day, "slot_idx": f_idx, "teacher": facs[0], "room": random.choice(rooms), "fixed": True})
                    placed = True
            
            if placed:
                continue

        # Fallback to dynamic placement for minor subjects
        if 'minor' in sub_name:
            placed = False
            minor_slots = []
            for d in DAYS:
                if d == 'Saturday': continue
                if d in full_days_per_div[div_name]:
                    minor_slots.append((d, 5))
            random.shuffle(minor_slots)
            
            for (day, slot_idx) in minor_slots:
                if (day, slot_idx) not in occupied[div_name] and (day, slot_idx + 1) not in occupied[div_name]:
                    occupied[div_name].add((day, slot_idx))
                    occupied[div_name].add((day, slot_idx + 1))
                    fac_map = faculty_mapping.get(div_name, {}).get(sub_id, faculty_mapping.get(sub_id, {}))
                    th_fac = fac_map.get('theory', '')
                    facs = [t for t in teachers if str(t.get('_id')) == th_fac]
                    if len(facs) == 0: facs = [random.choice(teachers)]
                    sess_copy = dict(session)
                    sess_copy['duration'] = 2
                    timetable.append({"session": sess_copy, "day": day, "slot_idx": slot_idx, "teacher": facs[0], "room": random.choice(rooms), "fixed": True})
                    placed = True
                    break
            if placed:
                continue
        
        if not placed:
            non_fixed_theories.append(session)

    for session in non_fixed_theories:
        div_name = session.get('division', 'DIV-A')
        sub_id = str(session['subject'].get('_id'))
        start_idx = div_start_indices.get(div_name, 0)
        
        available_slots = []
        for slot_idx in range(start_idx, len(SLOTS)):
            if slot_idx >= 7: continue
            for day in DAYS:
                if day == 'Saturday' and slot_idx not in SATURDAY_VALID_INDICES:
                    continue
                if day != 'Saturday' and slot_idx > 4 and day not in full_days_per_div[div_name]:
                    continue
                available_slots.append((day, slot_idx))
                
        shuffled_slots = sorted(available_slots, key=lambda x: random.random())
        for (day, slot_idx) in shuffled_slots:
            if (day, slot_idx) not in occupied[div_name] and (day, slot_idx) not in reserved_fixed[div_name]:
                occupied[div_name].add((day, slot_idx))
                fac_map = faculty_mapping.get(div_name, {}).get(sub_id, faculty_mapping.get(sub_id, {}))
                th_fac = fac_map.get('theory', '')
                facs = [t for t in teachers if str(t.get('_id')) == th_fac]
                if len(facs) == 0: facs = [random.choice(teachers)]
                timetable.append({"session": session, "day": day, "slot_idx": slot_idx, "teacher": facs[0], "room": random.choice(rooms)})
                break
                
    timetable.sort(key=lambda x: x['session']['id'])
    return timetable

def pack_individual(individual, global_start_idx=0):
    by_div_day = {}
    for entry in individual:
        div = entry['session'].get('division', 'DIV-A')
        day = entry['day']
        key = (div, day)
        if key not in by_div_day: by_div_day[key] = []
        by_div_day[key].append(entry)
        
    for (div, day), entries in by_div_day.items():
        fixed_entries = [e for e in entries if e.get('fixed')]
        non_fixed_entries = [e for e in entries if not e.get('fixed')]
        
        reserved_slots = set()
        for e in fixed_entries:
            duration = e['session'].get('duration', 1)
            for i in range(duration):
                reserved_slots.add(e['slot_idx'] + i)
                
        def sort_key(e):
            if e['session'].get('type') == 'lab_group' or e['session'].get('type') == 'lab': return (0, 0)
            return (1, 0)
            
        non_fixed_entries.sort(key=sort_key)
        
        current_idx = global_start_idx
        for entry in non_fixed_entries:
            duration = entry['session'].get('duration', 1)
            while True:
                fits = True
                for offset in range(duration):
                    if (current_idx + offset) in reserved_slots or (current_idx + offset) >= len(SLOTS):
                        fits = False
                        break
                if fits:
                    break
                current_idx += 1
            
            entry['slot_idx'] = current_idx
            current_idx += duration
            
    return individual

def calculate_fitness(individual, teachers, faculty_max_workloads, global_start_idx=0):
    pack_individual(individual, global_start_idx)
    conflicts = 0
    faculty_time = {}
    room_time = {}
    division_time = {}
    day_slots = {}
    
    for entry in individual:
        day, slot_idx = entry['day'], entry['slot_idx']
        div = entry['session'].get('division', 'DIV-A')
        duration = entry['session'].get('duration', 1)
        
        if div not in day_slots: day_slots[div] = {d: [] for d in DAYS}
        for i in range(duration):
            day_slots[div][day].append(slot_idx + i)
            
        # Check Saturday limit
        if day == 'Saturday' and (slot_idx not in SATURDAY_VALID_INDICES or (slot_idx + duration - 1) not in SATURDAY_VALID_INDICES):
            conflicts += 5000
            
        # Check Lab start index limit
        if entry['session']['type'] == 'lab_group' and slot_idx not in VALID_LAB_START_INDICES:
            conflicts += 5000

        faculties = entry['teacher'] if isinstance(entry['teacher'], list) else [entry['teacher']]
        rooms_assigned = entry['room'] if isinstance(entry['room'], list) else [entry['room']]
        
        for i in range(duration):
            slot_key = f"{day}_{slot_idx + i}"
            
            # Division overlap check
            if div not in division_time: division_time[div] = set()
            if slot_key in division_time[div]:
                conflicts += 10000
            division_time[div].add(slot_key)
            
            for fac in faculties:
                t_id = str(fac.get('_id', 'unknown'))
                if t_id not in faculty_time: faculty_time[t_id] = set()
                if slot_key in faculty_time[t_id]: conflicts += 1000
                faculty_time[t_id].add(slot_key)
            for rm in rooms_assigned:
                r_id = str(rm.get('_id', 'unknown'))
                if r_id not in room_time: room_time[r_id] = set()
                if slot_key in room_time[r_id]: conflicts += 1000
                room_time[r_id].add(slot_key)
                
    for div, days in day_slots.items():
        for day, slots in days.items():
            if len(slots) > 0:
                min_s, max_s = min(slots), max(slots)
                # Penalty for not starting continuously from the required start_idx
                if min_s != global_start_idx:
                    conflicts += 100
                
                # Extreme penalty for gaps to ensure completely continuous schedules
                gaps = (max_s - min_s + 1) - len(set(slots))
                conflicts += gaps * 50000
                
                if len(set(slots)) > MAX_DAILY_WORKING_HOURS + 2:
                    conflicts += 10
    
    return conflicts

def crossover(parent1, parent2):
    split = len(parent1) // 2
    return parent1[:split] + parent2[split:]

def mutate(individual, teachers, rooms, global_start_idx=0, mutation_rate=0.1):
    if random.random() > mutation_rate: return individual
    idx1 = random.randrange(len(individual))
    if individual[idx1].get('fixed'): return individual
    
    div_name = individual[idx1]['session'].get('division', 'DIV-A')
    available_slots = [(d, s) for d in DAYS for s in range(global_start_idx, 7) if not (d == 'Saturday' and s not in SATURDAY_VALID_INDICES)]
    if individual[idx1]['session']['type'] == 'lab_group':
        available_slots = [(d, s) for d, s in available_slots if s in VALID_LAB_START_INDICES]
    
    if available_slots:
        new_slot = random.choice(available_slots)
        individual[idx1]['day'], individual[idx1]['slot_idx'] = new_slot[0], new_slot[1]
    return individual

def run_genetic_algorithm(sessions, teachers, faculty_mapping, rooms, fixed_timings, faculty_max_workloads, global_start_idx=0):
    POPULATION_SIZE = 100 
    GENERATIONS = 300
    population = [create_individual(sessions, teachers, faculty_mapping, rooms, fixed_timings, global_start_idx) for _ in range(POPULATION_SIZE)]
    best_individual = None
    best_fitness = float('inf')
    for generation in range(GENERATIONS):
        population.sort(key=lambda x: calculate_fitness(x, teachers, faculty_max_workloads, global_start_idx))
        current_best = calculate_fitness(population[0], teachers, faculty_max_workloads, global_start_idx)
        if current_best < best_fitness:
            best_individual = population[0]
            best_fitness = current_best
        if best_fitness == 0: break
        next_generation = population[:2]
        while len(next_generation) < POPULATION_SIZE:
            parent1, parent2 = random.choice(population[:10]), random.choice(population[:10])
            child = crossover(parent1, parent2)
            child = mutate(child, teachers, rooms, global_start_idx, 0.1)
            next_generation.append(child)
        population = next_generation
    return best_individual

@app.get("/")
def read_root(): return {"status": "ML Engine is running"}

@app.post("/api/ml/generate")
def generate_timetable(request: GenerationRequest):
    sessions = []
    divs = request.divisions if request.divisions else [{"name": "DIV-A", "strength": 60}]
    
    for div in divs:
        div_name = div['name']
        div_lab_subs = [sub for sub in request.subjects if sub.get("practicalHours", 0) > 0 and 'minor' not in sub.get('subjectName', '').lower()]
        num_labs = len(div_lab_subs)
        
        if num_labs > 0:
            div_strength = div.get('strength', 72)
            
            if not request.labsConfig:
                max_batch_size = 20
            else:
                max_batch_size = min(lab.get('capacity', 30) for lab in request.labsConfig)
                
            if max_batch_size <= 0: max_batch_size = 20
                
            import math
            num_batches = math.ceil(div_strength / max_batch_size)
            if num_batches < 1: num_batches = 1
            
            batches = [f"A{i+1}" for i in range(num_batches)]
            
            assignments = [(b, sub) for b in range(num_batches) for sub in div_lab_subs]
            random.shuffle(assignments) 
            
            slots = []
            while assignments:
                slot_assignments = []
                used_batches = set()
                used_subs = set()
                
                # Available physical labs in this slot
                available_labs = list(request.labsConfig) if request.labsConfig else [{"id": "Lab", "capacity": 100}] * num_labs
                
                for b, sub in assignments[:]:
                    if b not in used_batches and sub.get('_id') not in used_subs:
                        # Find a physical lab that can fit this batch
                        # Batch size is approx div_strength / num_batches
                        batch_size = div_strength / num_batches
                        
                        suitable_lab_idx = -1
                        for idx, phys_lab in enumerate(available_labs):
                            if phys_lab.get('capacity', 30) >= batch_size:
                                suitable_lab_idx = idx
                                break
                                
                        if suitable_lab_idx != -1:
                            assigned_lab = available_labs.pop(suitable_lab_idx)
                            slot_assignments.append((b, sub, assigned_lab))
                            used_batches.add(b)
                            used_subs.add(sub.get('_id'))
                            assignments.remove((b, sub))
                            
                if not slot_assignments:
                    # If we couldn't assign anything (e.g., batch too big for remaining labs)
                    # We might be stuck. Break to avoid infinite loop.
                    break
                    
                slots.append(slot_assignments)
            
            for i, slot_assignments in enumerate(slots):
                group_sessions = []
                for b, sub, phys_lab in slot_assignments:
                    group_sessions.append({
                        "id": f"{div_name}_{sub.get('_id')}_lab_{i}_{b}",
                        "subject": sub,
                        "type": "lab",
                        "duration": 2,
                        "division": div_name,
                        "batch": batches[b],
                        "assigned_lab": phys_lab
                    })
                sessions.append({
                    "id": f"{div_name}_lab_group_{i}",
                    "type": "lab_group",
                    "duration": 2,
                    "division": div_name,
                    "sessions": group_sessions
                })
                
        for sub in request.subjects:
            is_minor = 'minor' in sub.get('subjectName', '').lower()
            if is_minor:
                sessions.append({"id": f"{div_name}_{sub.get('_id')}_minor", "subject": sub, "type": "theory", "duration": 2, "division": div_name})
            else:
                for i in range(sub.get("lectureHours", 0) + sub.get("tutorialHours", 0)):
                    sessions.append({"id": f"{div_name}_{sub.get('_id')}_th_{i}", "subject": sub, "type": "theory", "duration": 1, "division": div_name})
                    
    global_start_idx = 0 if request.semester in [1, 2, 5] else 1
                    
    best_individual = run_genetic_algorithm(sessions, request.teachers, request.facultyMapping, request.rooms, request.fixedTimings, request.facultyMaxWorkloads, global_start_idx)
    pack_individual(best_individual, global_start_idx)
    best_fitness = calculate_fitness(best_individual, request.teachers, request.facultyMaxWorkloads, global_start_idx)
    
    matrix = {}
    raw_schedules = {div['name']: [] for div in divs}
    
    for div in divs:
        matrix[div['name']] = {
            "divisionName": div['name'],
            "semester": request.subjects[0].get("semester", 1) if request.subjects else 1,
            "days": {day: {slot: None for slot in SLOTS} for day in DAYS}
        }
    
    for entry in best_individual:
        day = entry['day']
        slot = SLOTS[entry['slot_idx']]
        
        if entry['session']['type'] == 'lab_group':
            div_name = entry['session']['division']
            
            # For the matrix preview, combine all batches and subjects
            sub_codes = []
            batches = []
            lab_display_parts = []
            
            for idx, sub_session in enumerate(entry['session']['sessions']):
                fac = entry['teacher'][idx]
                r = entry['room'][idx]
                
                s_code = sub_session['subject'].get('subjectCode', sub_session['subject'].get('subjectName'))
                sub_codes.append(s_code)
                b_name = sub_session['batch']
                if b_name:
                    batches.append(b_name)
                    lab_display_parts.append(f"{s_code}({b_name})")
                else:
                    lab_display_parts.append(s_code)
                
                raw_schedules[div_name].append({
                    "day": day,
                    "startTime": slot,
                    "endTime": SLOTS[entry['slot_idx'] + 2] if entry['slot_idx'] + 2 < len(SLOTS) else "17:00",
                    "subject": {"_id": str(sub_session['subject'].get('_id'))},
                    "faculty": [{"_id": str(fac.get('_id'))}],
                    "room": {"_id": str(r.get('_id', ''))} if r else None,
                    "batch": {"batchName": sub_session['batch']}
                })
                
            if matrix[div_name]['days'][day][slot] is None:
                matrix[div_name]['days'][day][slot] = {
                    "subject": { "subjectCode": "/".join(lab_display_parts) },
                    "faculty": entry['teacher'],
                    "room": entry['room'],
                    "type": "lab",
                    "duration": 2,
                    "startTime": slot,
                    "endTime": SLOTS[entry['slot_idx'] + 2] if entry['slot_idx'] + 2 < len(SLOTS) else "17:00",
                    "batch": {"batchName": "(" + "/".join(batches) + ")"}
                }
            
            if entry['slot_idx'] + 1 < len(SLOTS):
                next_slot = SLOTS[entry['slot_idx'] + 1]
                if matrix[div_name]['days'][day].get(next_slot) is None:
                    # Note: We need a placeholder for the second half of the 2-hour lab
                    matrix[div_name]['days'][day][next_slot] = {"type": "busy", "parent": slot}
        else:
            div_name = entry['session'].get('division', 'DIV-A')
            faculties = entry['teacher'] if isinstance(entry['teacher'], list) else [entry['teacher']]
            
            matrix[div_name]['days'][day][slot] = {
                "subject": entry['session']['subject'],
                "faculty": faculties, 
                "room": entry['room'],
                "type": entry['session']['type'],
                "startTime": slot,
                "endTime": SLOTS[entry['slot_idx'] + 1] if entry['slot_idx'] + 1 < len(SLOTS) else "17:00",
                "batch": None
            }
            
            raw_schedules[div_name].append({
                "day": day,
                "startTime": slot,
                "endTime": SLOTS[entry['slot_idx'] + 1] if entry['slot_idx'] + 1 < len(SLOTS) else "17:00",
                "subject": {"_id": str(entry['session']['subject'].get('_id'))},
                "faculty": [{"_id": str(f.get('_id'))} for f in faculties],
                "room": {"_id": str(entry['room'].get('_id', ''))} if entry.get('room') else None
            })
            
            if entry['session']['duration'] > 1 and entry['slot_idx'] + 1 < len(SLOTS):
                next_slot = SLOTS[entry['slot_idx'] + 1]
                matrix[div_name]['days'][day][next_slot] = {"type": "busy", "parent": slot}
                raw_schedules[div_name].append({
                    "day": day,
                    "startTime": next_slot,
                    "endTime": SLOTS[entry['slot_idx'] + 2] if entry['slot_idx'] + 2 < len(SLOTS) else "17:00",
                    "subject": {"_id": str(entry['session']['subject'].get('_id'))},
                    "faculty": [{"_id": str(f.get('_id'))} for f in faculties],
                    "room": {"_id": str(entry['room'].get('_id', ''))} if entry.get('room') else None
                })

    return {
        "status": "success",
        "message": f"Conflicts: {best_fitness}",
        "matrix": matrix,
        "slots": SLOTS,
        "rawSchedules": raw_schedules,
        "workload": {},
        "conflicts": {"conflicts": [] if best_fitness == 0 else [{"message": f"{best_fitness} minor conflicts detected between divisions. Try running again."}]}
    }
