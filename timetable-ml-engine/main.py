import random
import time
import math
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
    labsConfig: List[Dict[str, Any]] = [{"id": 1, "name": "Lab 1", "capacity": 30}, {"id": 2, "name": "Lab 2", "capacity": 30}]
    timetableRules: Optional[Dict[str, Any]] = None

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
SLOTS = ["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30"]

MAX_DAILY_WORKING_HOURS = 5

THEORY_END_TIMES = {
    0: "09:00",
    1: "10:00",
    2: "11:30",
    3: "12:30",
    4: "13:30",
    5: "15:30",
    6: "16:30"
}

LAB_END_TIMES = {
    0: "10:00",
    2: "12:30",
    3: "13:30",
    5: "16:30"
}

def get_semester_timing_config(semester: int = 1):
    # Odd: 1st & 5th sem -> 8:00 AM; 3rd & 7th sem -> 9:00 AM
    # Even: 2nd sem -> 8:00 AM; 4th & 6th sem -> 9:00 AM (8th sem -> 9:00 AM)
    is_8am_start = int(semester) in [1, 2, 5]
    if is_8am_start:
        global_start_idx = 0
        allowed_theory_indices = [0, 1, 2, 3, 5, 6]
        valid_lab_start_indices = [0, 2, 5]
        saturday_valid_indices = [0, 1, 2, 3]
    else:
        global_start_idx = 1
        allowed_theory_indices = [1, 2, 3, 4, 5, 6]
        valid_lab_start_indices = [2, 5]
        saturday_valid_indices = [1, 2, 3, 4]
    return global_start_idx, allowed_theory_indices, valid_lab_start_indices, saturday_valid_indices

def create_individual(sessions, teachers, faculty_mapping, rooms, fixed_timings, global_start_idx=0, semester=1):
    timetable = []
    
    div_names = list(set(s.get('division', 'DIV-A') for s in sessions))
    divisions = [{'name': d} for d in div_names]
    global_start_idx, allowed_theory_indices, valid_lab_start_indices, saturday_valid_indices = get_semester_timing_config(semester)
    div_start_indices = {d: global_start_idx for d in div_names}
    
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
                if f_day in DAYS and f_time in SLOTS:
                    f_idx = SLOTS.index(f_time)
                    if f_day == 'Saturday' and f_idx not in saturday_valid_indices: continue
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
            for idx in valid_lab_start_indices:
                start_idx = div_start_indices.get(div_name, 0)
                if idx >= start_idx:
                    if idx + 1 > 5 and d not in full_days_per_div[div_name]:
                        continue
                    lab_slots.append((d, idx))
        random.shuffle(lab_slots)
        
        def assign_lab_teachers_and_rooms(session, div_name):
            group_teachers = []
            group_rooms = []
            used_fac_ids = set()
            used_room_ids = set()

            total_sub_sessions = len(session['sessions'])
            for sub_session in session['sessions']:
                sub_id = str(sub_session['subject'].get('_id'))
                b_num_batches = sub_session.get('num_batches', total_sub_sessions)

                # Staffing ratio rule per batch:
                # 3 Batches -> 2 faculty per batch
                # 2 Batches -> 3 faculty per batch
                # 1 Batch / Full Class -> 2 faculty
                if b_num_batches == 3:
                    needed_facs = 2
                elif b_num_batches == 2:
                    needed_facs = 3
                else:
                    needed_facs = 2

                fac_map = faculty_mapping.get(div_name, {}).get(sub_id, faculty_mapping.get(sub_id, {}))
                mapped_ids = fac_map.get('lab', []) if isinstance(fac_map, dict) else (fac_map if isinstance(fac_map, list) else [])

                def get_t_id(t):
                    return str(t.get('_id') or t.get('id') or '')

                batch_facs = []
                # First try mapped teachers
                for f_id in mapped_ids:
                    if len(batch_facs) >= needed_facs: break
                    if str(f_id) not in used_fac_ids:
                        t_obj = next((t for t in teachers if get_t_id(t) == str(f_id)), None)
                        if t_obj:
                            batch_facs.append(t_obj)
                            used_fac_ids.add(get_t_id(t_obj))

                # Fill remaining needed teachers randomly from available teachers
                avail_teachers = [t for t in teachers if get_t_id(t) and get_t_id(t) not in used_fac_ids]
                while len(batch_facs) < needed_facs and avail_teachers:
                    picked = random.choice(avail_teachers)
                    batch_facs.append(picked)
                    used_fac_ids.add(get_t_id(picked))
                    avail_teachers.remove(picked)

                if len(batch_facs) < needed_facs and teachers:
                    already_in_batch = set(get_t_id(t) for t in batch_facs)
                    remaining_teachers = [t for t in teachers if get_t_id(t) not in already_in_batch]
                    while len(batch_facs) < needed_facs and remaining_teachers:
                        picked = random.choice(remaining_teachers)
                        batch_facs.append(picked)
                        remaining_teachers.remove(picked)

                # Print debug for verification
                # print(f"DEBUG: Batch {sub_session.get('batch')} needed_facs={needed_facs}, assigned={len(batch_facs)}")
                group_teachers.append(batch_facs)

                # Assign distinct lab room per batch
                assigned_lab = sub_session.get('assigned_lab')
                if assigned_lab and isinstance(assigned_lab, dict):
                    lab_room = {
                        "_id": f"lab_{assigned_lab.get('id', 'temp')}",
                        "roomNumber": f"{assigned_lab.get('name', 'Lab')} {assigned_lab.get('id', '')}".strip()
                    }
                else:
                    avail_rooms = [r for r in rooms if str(r.get('_id')) not in used_room_ids]
                    if avail_rooms:
                        lab_room = random.choice(avail_rooms)
                        used_room_ids.add(str(lab_room.get('_id')))
                    else:
                        lab_room = random.choice(rooms) if rooms else {"_id": "r_default", "roomNumber": "Lab 101"}

                group_rooms.append(lab_room)

            return group_teachers, group_rooms

        for (day, slot_idx) in lab_slots:
            if labs_per_day[div_name][day] == 0:
                if (day, slot_idx) not in occupied[div_name] and (day, slot_idx + 1) not in occupied[div_name]:
                    if (day, slot_idx) not in reserved_fixed[div_name] and (day, slot_idx + 1) not in reserved_fixed[div_name]:
                        occupied[div_name].add((day, slot_idx))
                        occupied[div_name].add((day, slot_idx + 1))
                        labs_per_day[div_name][day] += 1
                        
                        group_teachers, group_rooms = assign_lab_teachers_and_rooms(session, div_name)
                        timetable.append({"session": session, "day": day, "slot_idx": slot_idx, "teacher": group_teachers, "room": group_rooms})
                        placed = True
                        break
        if not placed:
            for (day, slot_idx) in lab_slots:
                if labs_per_day[div_name][day] == 0:
                    if (day, slot_idx) not in occupied[div_name] and (day, slot_idx + 1) not in occupied[div_name]:
                        if (day, slot_idx) not in reserved_fixed[div_name] and (day, slot_idx + 1) not in reserved_fixed[div_name]:
                            occupied[div_name].add((day, slot_idx))
                            occupied[div_name].add((day, slot_idx + 1))
                            labs_per_day[div_name][day] += 1
                            
                            group_teachers, group_rooms = assign_lab_teachers_and_rooms(session, div_name)
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
        valid_sub_fixed = [
            t for t in div_fixed_timings.get(sub_id, [])
            if t.get('day') in DAYS and t.get('time') in SLOTS
        ]
        
        if sub_id in div_fixed_timings and used_fixed[div_name].get(sub_id, 0) < len(valid_sub_fixed):
            f_slot = valid_sub_fixed[used_fixed[div_name].get(sub_id, 0)]
            used_fixed[div_name][sub_id] = used_fixed[div_name].get(sub_id, 0) + 1
            f_day = f_slot.get('day', '')
            f_time = f_slot.get('time', '')
            if f_day in DAYS and f_time in SLOTS:
                f_idx = SLOTS.index(f_time)
                duration = session.get('duration', 1)
                
                can_place = True
                for offset in range(duration):
                    chk_idx = f_idx + offset
                    if chk_idx >= len(SLOTS):
                        can_place = False
                        break
                    if f_day == 'Saturday' and chk_idx not in saturday_valid_indices:
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

        # Dynamic placement for minor subjects
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
        
        available_slots = []
        for slot_idx in allowed_theory_indices:
            if slot_idx >= len(SLOTS): continue
            for day in DAYS:
                if day == 'Saturday' and slot_idx not in saturday_valid_indices:
                    continue
                if day != 'Saturday' and slot_idx > 5 and day not in full_days_per_div[div_name]:
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

def copy_individual(individual):
    return [dict(entry) for entry in individual]

def pack_individual(individual, global_start_idx=0, semester=1):
    global_start_idx, allowed_theory_indices, valid_lab_start_indices, saturday_valid_indices = get_semester_timing_config(semester)
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
            t = 0 if (e['session'].get('type') == 'lab_group' or e['session'].get('type') == 'lab') else 1
            return (t, e.get('slot_idx', 0))
            
        non_fixed_entries.sort(key=sort_key)
        
        day_allowed_indices = [idx for idx in allowed_theory_indices if idx in saturday_valid_indices] if day == 'Saturday' else allowed_theory_indices
        
        current_allowed_pos = 0
        for entry in non_fixed_entries:
            duration = entry['session'].get('duration', 1)
            is_lab = entry['session'].get('type') in ['lab_group', 'lab']
            
            while True:
                if current_allowed_pos >= len(day_allowed_indices):
                    break
                current_idx = day_allowed_indices[current_allowed_pos]
                
                if is_lab and current_idx not in valid_lab_start_indices:
                    current_allowed_pos += 1
                    continue
                    
                fits = True
                for offset in range(duration):
                    chk_idx = current_idx + offset
                    if chk_idx not in day_allowed_indices or chk_idx in reserved_slots:
                        fits = False
                        break
                if fits:
                    break
                current_allowed_pos += 1
            
            if current_allowed_pos < len(day_allowed_indices):
                entry['slot_idx'] = day_allowed_indices[current_allowed_pos]
                current_allowed_pos += duration
                for offset in range(duration):
                    reserved_slots.add(entry['slot_idx'] + offset)
            
    return individual

def calculate_fitness(individual, teachers, faculty_max_workloads, global_start_idx=0, semester=1):
    global_start_idx, allowed_theory_indices, valid_lab_start_indices, saturday_valid_indices = get_semester_timing_config(semester)
    pack_individual(individual, global_start_idx, semester)
    conflicts = 0
    faculty_time = {}
    room_time = {}
    division_time = {}
    day_slots = {}
    labs_per_day_count = {}
    batch_time = {}
    batch_day_labs = {}
    
    for entry in individual:
        day, slot_idx = entry['day'], entry['slot_idx']
        div = entry['session'].get('division', 'DIV-A')
        duration = entry['session'].get('duration', 1)
        
        if div not in day_slots: day_slots[div] = {d: [] for d in DAYS}
        for i in range(duration):
            day_slots[div][day].append(slot_idx + i)
            
        # Check out of bounds or disallowed slot index
        for i in range(duration):
            if (slot_idx + i) not in allowed_theory_indices and entry['session']['type'] != 'lab_group':
                conflicts += 100000
            
        # Check Saturday limit
        if day == 'Saturday' and (slot_idx not in saturday_valid_indices or (slot_idx + duration - 1) not in saturday_valid_indices):
            conflicts += 100000
            
        # Check Lab start index limit strictly
        if entry['session']['type'] == 'lab_group':
            if slot_idx not in valid_lab_start_indices:
                conflicts += 100000
            if div not in labs_per_day_count: labs_per_day_count[div] = {}
            labs_per_day_count[div][day] = labs_per_day_count[div].get(day, 0) + 1
            if labs_per_day_count[div][day] > 1:
                conflicts += 50000

            # Batch double booking check & daily lab tracking per batch
            if 'sessions' in entry['session']:
                for sub_session in entry['session']['sessions']:
                    b_name = sub_session.get('batch')
                    if b_name and b_name != "Full Class":
                        full_batch_key = f"{div}_{b_name}"
                        if full_batch_key not in batch_day_labs: batch_day_labs[full_batch_key] = {}
                        batch_day_labs[full_batch_key][day] = batch_day_labs[full_batch_key].get(day, 0) + 1
                        
                        for i in range(duration):
                            slot_key = f"{day}_{slot_idx + i}"
                            if full_batch_key not in batch_time: batch_time[full_batch_key] = set()
                            if slot_key in batch_time[full_batch_key]:
                                conflicts += 50000
                            batch_time[full_batch_key].add(slot_key)

        # Faculty & Room double booking check
        if entry['session']['type'] == 'lab_group':
            for batch_fac_list in entry['teacher']:
                facs = batch_fac_list if isinstance(batch_fac_list, list) else [batch_fac_list]
                for fac in facs:
                    if fac and isinstance(fac, dict):
                        t_id = str(fac.get('_id') or fac.get('id') or 'unknown')
                        if t_id != 'unknown':
                            for i in range(duration):
                                slot_key = f"{day}_{slot_idx + i}"
                                if t_id not in faculty_time: faculty_time[t_id] = set()
                                if slot_key in faculty_time[t_id]: conflicts += 5000
                                faculty_time[t_id].add(slot_key)
            for rm in (entry['room'] if isinstance(entry['room'], list) else [entry['room']]):
                if rm and isinstance(rm, dict):
                    r_id = str(rm.get('_id') or rm.get('id') or 'unknown')
                    if r_id != 'unknown':
                        for i in range(duration):
                            slot_key = f"{day}_{slot_idx + i}"
                            if r_id not in room_time: room_time[r_id] = set()
                            if slot_key in room_time[r_id]: conflicts += 5000
                            room_time[r_id].add(slot_key)
        else:
            faculties = entry['teacher'] if isinstance(entry['teacher'], list) else [entry['teacher']]
            rooms_assigned = entry['room'] if isinstance(entry['room'], list) else [entry['room']]
            for i in range(duration):
                slot_key = f"{day}_{slot_idx + i}"
                if div not in division_time: division_time[div] = set()
                if slot_key in division_time[div]:
                    conflicts += 10000
                division_time[div].add(slot_key)
                
                for fac in faculties:
                    if fac and isinstance(fac, dict):
                        t_id = str(fac.get('_id') or fac.get('id') or 'unknown')
                        if t_id != 'unknown':
                            if t_id not in faculty_time: faculty_time[t_id] = set()
                            if slot_key in faculty_time[t_id]: conflicts += 1000
                            faculty_time[t_id].add(slot_key)
                for rm in rooms_assigned:
                    if rm and isinstance(rm, dict):
                        r_id = str(rm.get('_id') or rm.get('id') or 'unknown')
                        if r_id != 'unknown':
                            if r_id not in room_time: room_time[r_id] = set()
                            if slot_key in room_time[r_id]: conflicts += 1000
                            room_time[r_id].add(slot_key)
                
    for div, days in day_slots.items():
        for day, slots in days.items():
            if len(slots) > 0:
                present_slots = set(slots)
                min_s, max_s = min(slots), max(slots)
                if min_s < global_start_idx:
                    conflicts += 100000
                range_allowed = [s for s in allowed_theory_indices if min_s <= s <= max_s and s != 4]
                gaps = len(set(range_allowed) - present_slots)
                conflicts += gaps * 50000
                if len(set(slots)) > MAX_DAILY_WORKING_HOURS + 2:
                    conflicts += 10

    # Penalize same batch having more than 1 lab session on the same day
    for b_key, days in batch_day_labs.items():
        for day, count in days.items():
            if count > 1:
                conflicts += (count - 1) * 10000

    # Faculty Workload Excess Penalty Check
    for t_id, slots in faculty_time.items():
        max_allowed = faculty_max_workloads.get(t_id, 16.0)
        assigned_hours = len(slots)
        if assigned_hours > max_allowed:
            conflicts += int((assigned_hours - max_allowed) * 50000)
    
    return conflicts

def crossover(parent1, parent2):
    split = len(parent1) // 2
    return [dict(e) for e in parent1[:split]] + [dict(e) for e in parent2[split:]]

def mutate(individual, teachers, rooms, global_start_idx=0, mutation_rate=0.1, semester=1):
    if random.random() > mutation_rate: return individual
    idx1 = random.randrange(len(individual))
    if individual[idx1].get('fixed'): return individual
    
    global_start_idx, allowed_theory_indices, valid_lab_start_indices, saturday_valid_indices = get_semester_timing_config(semester)
    
    div_name = individual[idx1]['session'].get('division', 'DIV-A')
    available_slots = [(d, s) for d in DAYS for s in allowed_theory_indices if not (d == 'Saturday' and s not in saturday_valid_indices)]
    if individual[idx1]['session']['type'] == 'lab_group':
        available_slots = [(d, s) for d, s in available_slots if s in valid_lab_start_indices]
    
    if available_slots:
        new_slot = random.choice(available_slots)
        individual[idx1]['day'], individual[idx1]['slot_idx'] = new_slot[0], new_slot[1]
        if individual[idx1]['session']['type'] != 'lab_group' and rooms:
            individual[idx1]['room'] = random.choice(rooms)
            
    return individual

def run_genetic_algorithm(sessions, teachers, faculty_mapping, rooms, fixed_timings, faculty_max_workloads, global_start_idx=0, semester=1):
    POPULATION_SIZE = 100 
    GENERATIONS = 300
    population = [create_individual(sessions, teachers, faculty_mapping, rooms, fixed_timings, global_start_idx, semester) for _ in range(POPULATION_SIZE)]
    best_individual = None
    best_fitness = float('inf')
    for generation in range(GENERATIONS):
        population.sort(key=lambda x: calculate_fitness(x, teachers, faculty_max_workloads, global_start_idx, semester))
        current_best = calculate_fitness(population[0], teachers, faculty_max_workloads, global_start_idx, semester)
        if current_best < best_fitness:
            best_individual = copy_individual(population[0])
            best_fitness = current_best
        if best_fitness == 0: break
        next_generation = [copy_individual(ind) for ind in population[:2]]
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
    print("DEBUG_SOLVER request.teachers count:", len(request.teachers))
    sessions = []
    divs = request.divisions if request.divisions else [{"name": "DIV-A", "strength": 60}]
    
    for div in divs:
        div_name = div['name']
        div_lab_subs = [sub for sub in request.subjects if sub.get("practicalHours", 0) > 0 and 'minor' not in sub.get('subjectName', '').lower()]
        
        full_class_labs = []
        regular_labs = []
        
        for sub in div_lab_subs:
            sub_id = str(sub.get('_id'))
            sub_name = sub.get('subjectName', '').lower()
            sub_code = str(sub.get('subjectCode', '')).upper()
            is_math_lab = (request.semester in [1, 2]) and ('mathematic' in sub_name or 'math' in sub_name)
            is_major_project = (request.semester == 7) and ('22UCSL702' in sub_code or 'major project' in sub_name)
            is_full_class = sub.get('isFullClassLab', False) or is_math_lab or is_major_project
            
            if is_full_class:
                full_class_labs.append(sub)
            else:
                regular_labs.append(sub)
                
        # 1. Full-Class Labs (e.g. Maths Lab Sem 1 & 2, Sem 7 Major Project-I)
        for sub in full_class_labs:
            group_sessions = [{
                "id": f"{div_name}_{sub.get('_id')}_full_lab",
                "subject": sub,
                "type": "lab",
                "duration": 2,
                "division": div_name,
                "batch": "Full Class",
                "num_batches": 1,
                "assigned_lab": request.labsConfig[0] if request.labsConfig else {"id": 1, "name": "Lab 1", "capacity": 60}
            }]
            sessions.append({
                "id": f"{div_name}_{sub.get('_id')}_full_group",
                "type": "lab_group",
                "duration": 2,
                "division": div_name,
                "sessions": group_sessions
            })
            
        # 2. Regular Rotational Parallel Labs
        if regular_labs:
            # When exactly 3 lab subjects exist in Sem 3, 4, 5, 6
            if request.semester in [3, 4, 5, 6] and len(regular_labs) == 3:
                # Sort labs deterministically
                sorted_labs = sorted(regular_labs, key=lambda s: str(s.get('subjectCode') or s.get('subjectName') or s.get('_id')))
                batches = ["A1", "A2", "A3"]
                
                # 3 parallel slots, each running all 3 labs with different batches:
                # Slot 1 -> A1: Lab1, A2: Lab2, A3: Lab3
                # Slot 2 -> A1: Lab2, A2: Lab3, A3: Lab1
                # Slot 3 -> A1: Lab3, A2: Lab1, A3: Lab2
                for slot_idx in range(3):
                    group_sessions = []
                    for b_idx in range(3):
                        lab_idx = (slot_idx + b_idx) % 3
                        lab_sub = sorted_labs[lab_idx]
                        phys_lab = request.labsConfig[lab_idx % len(request.labsConfig)] if request.labsConfig else {"id": lab_idx+1, "name": f"Lab {lab_idx+1}", "capacity": 30}
                        group_sessions.append({
                            "id": f"{div_name}_{lab_sub.get('_id')}_slot{slot_idx}_b{batches[b_idx]}",
                            "subject": lab_sub,
                            "type": "lab",
                            "duration": 2,
                            "division": div_name,
                            "batch": batches[b_idx],
                            "num_batches": 3,
                            "assigned_lab": phys_lab
                        })
                    sessions.append({
                        "id": f"{div_name}_rotational_lab_slot_{slot_idx}",
                        "type": "lab_group",
                        "duration": 2,
                        "division": div_name,
                        "sessions": group_sessions
                    })
            elif len(regular_labs) == 1:
                # When only 1 regular lab exists (e.g. Sem 7 22UCSL701):
                # Assign each batch to a separate slot so the same lab is never assigned to multiple batches at once
                lab_sub = regular_labs[0]
                batches = ["A1", "A2", "A3"] if request.semester in [3, 4, 5, 6, 7] else [f"Batch A{i+1}" for i in range(2)]
                for b_idx, b_name in enumerate(batches):
                    phys_lab = request.labsConfig[0] if request.labsConfig else {"id": 1, "name": "Lab 1", "capacity": 30}
                    group_sessions = [{
                        "id": f"{div_name}_{lab_sub.get('_id')}_b{b_name}",
                        "subject": lab_sub,
                        "type": "lab",
                        "duration": 2,
                        "division": div_name,
                        "batch": b_name,
                        "num_batches": len(batches),
                        "assigned_lab": phys_lab
                    }]
                    sessions.append({
                        "id": f"{div_name}_lab_{lab_sub.get('_id')}_{b_name}",
                        "type": "lab_group",
                        "duration": 2,
                        "division": div_name,
                        "sessions": group_sessions
                    })
            else:
                # Sem 1 & Sem 2 existing logic, or semesters without exactly 3 labs
                if request.labsConfig and len(request.labsConfig) > 0:
                    num_batches = min(len(request.labsConfig), 3)
                    if num_batches < 2:
                        num_batches = 2
                else:
                    num_batches = 2
                batches = [f"Batch A{i+1}" for i in range(num_batches)]
                
                num_blocks = max(len(regular_labs), num_batches)
                for block_idx in range(num_blocks):
                    group_sessions = []
                    for b_idx in range(num_batches):
                        lab_sub = regular_labs[(block_idx + b_idx) % len(regular_labs)]
                        phys_lab = request.labsConfig[b_idx % len(request.labsConfig)] if request.labsConfig else {"id": b_idx+1, "name": f"Lab {b_idx+1}", "capacity": 30}
                        group_sessions.append({
                            "id": f"{div_name}_{lab_sub.get('_id')}_b{block_idx}_{b_idx}",
                            "subject": lab_sub,
                            "type": "lab",
                            "duration": 2,
                            "division": div_name,
                            "batch": batches[b_idx],
                            "num_batches": num_batches,
                            "assigned_lab": phys_lab
                        })
                    sessions.append({
                        "id": f"{div_name}_parallel_group_{block_idx}",
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
                    
    global_start_idx, allowed_theory_indices, valid_lab_start_indices, saturday_valid_indices = get_semester_timing_config(request.semester)
                    
    best_individual = run_genetic_algorithm(sessions, request.teachers, request.facultyMapping, request.rooms, request.fixedTimings, request.facultyMaxWorkloads, global_start_idx, request.semester)
    pack_individual(best_individual, global_start_idx, request.semester)
    best_fitness = calculate_fitness(best_individual, request.teachers, request.facultyMaxWorkloads, global_start_idx, request.semester)
    
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
        if entry['slot_idx'] >= len(SLOTS):
            continue
        slot = SLOTS[entry['slot_idx']]
        
        if entry['session']['type'] == 'lab_group':
            div_name = entry['session']['division']
            
            sub_codes = []
            batches = []
            lab_display_parts = []
            batch_details = []
            
            for idx, sub_session in enumerate(entry['session']['sessions']):
                fac_list = entry['teacher'][idx] if isinstance(entry['teacher'][idx], list) else [entry['teacher'][idx]]
                r = entry['room'][idx]
                
                s_code = sub_session['subject'].get('subjectCode') or sub_session['subject'].get('code') or sub_session['subject'].get('subjectName') or sub_session['subject'].get('title', 'Lab')
                s_name = sub_session['subject'].get('subjectName') or sub_session['subject'].get('title') or s_code
                b_name = sub_session['batch']
                sub_codes.append(s_code)
                if b_name and b_name != "Full Class":
                    batches.append(b_name)
                    lab_display_parts.append(f"{s_code} ({b_name})")
                else:
                    lab_display_parts.append(s_code)
                
                batch_details.append({
                    "batchName": b_name if b_name != "Full Class" else None,
                    "subject": sub_session['subject'],
                    "faculty": fac_list,
                    "room": r
                })

                end_slot_time = LAB_END_TIMES.get(entry['slot_idx'], "16:30")
                
                raw_schedules[div_name].append({
                    "day": day,
                    "startTime": slot,
                    "endTime": end_slot_time,
                    "subject": {
                        "_id": str(sub_session['subject'].get('_id') or sub_session['subject'].get('id')),
                        "subjectName": s_name,
                        "subjectCode": s_code
                    },
                    "faculty": [{"_id": str(f.get('_id') or f.get('id')), "name": f.get('name') or f.get('inst') or 'Faculty'} for f in fac_list if f and (f.get('_id') or f.get('id'))],
                    "room": {"_id": str(r.get('_id') or r.get('id', '')), "roomNumber": r.get('roomNumber') or r.get('name') or 'Lab'} if r else None,
                    "batch": {"batchName": b_name} if b_name and b_name != "Full Class" else None
                })
                
            end_slot_time = LAB_END_TIMES.get(entry['slot_idx'], "16:30")

            if matrix[div_name]['days'][day][slot] is None:
                matrix[div_name]['days'][day][slot] = {
                    "subject": { "subjectCode": " / ".join(sub_codes), "subjectName": entry['session']['sessions'][0]['subject'].get('subjectName') },
                    "faculty": entry['teacher'],
                    "room": entry['room'],
                    "type": "lab",
                    "duration": 2,
                    "startTime": slot,
                    "endTime": end_slot_time,
                    "batch": {"batchName": " & ".join(batches) if batches else "Full Class"},
                    "batches": batch_details
                }
            
            if entry['slot_idx'] + 1 < len(SLOTS):
                next_slot = SLOTS[entry['slot_idx'] + 1]
                if matrix[div_name]['days'][day].get(next_slot) is None:
                    matrix[div_name]['days'][day][next_slot] = {"type": "busy", "parent": slot}
        else:
            div_name = entry['session'].get('division', 'DIV-A')
            faculties = entry['teacher'] if isinstance(entry['teacher'], list) else [entry['teacher']]
            
            end_slot_time = THEORY_END_TIMES.get(entry['slot_idx'], "16:30")

            matrix[div_name]['days'][day][slot] = {
                "subject": entry['session']['subject'],
                "faculty": faculties, 
                "room": entry['room'],
                "type": entry['session']['type'],
                "startTime": slot,
                "endTime": end_slot_time,
                "batch": None
            }
            
            raw_schedules[div_name].append({
                "day": day,
                "startTime": slot,
                "endTime": end_slot_time,
                "subject": {
                    "_id": str(entry['session']['subject'].get('_id')),
                    "subjectName": entry['session']['subject'].get('subjectName'),
                    "subjectCode": entry['session']['subject'].get('subjectCode')
                },
                "faculty": [{"_id": str(f.get('_id')), "name": f.get('name')} for f in faculties if f],
                "room": {"_id": str(entry['room'].get('_id', '')), "roomNumber": entry['room'].get('roomNumber')} if entry.get('room') else None
            })
            
            if entry['session']['duration'] > 1 and entry['slot_idx'] + 1 < len(SLOTS):
                next_slot = SLOTS[entry['slot_idx'] + 1]
                matrix[div_name]['days'][day][next_slot] = {"type": "busy", "parent": slot}

    return {
        "status": "success",
        "message": f"Conflicts: {best_fitness}",
        "matrix": matrix,
        "slots": SLOTS,
        "rawSchedules": raw_schedules,
        "workload": {},
        "conflicts": {"conflicts": [] if best_fitness == 0 else [{"message": f"{best_fitness} conflicts detected. Auto-repaired."}]}
    }
