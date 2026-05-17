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
    divisions: Optional[List[Dict[str, Any]]] = [{"name": "DIV-A", "strength": 60}]
    facultyMaxWorkloads: Dict[str, int] = {}
    fixedTimings: Dict[str, Dict[str, List[Dict[str, str]]]] = {}

DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
SLOTS = ["08:00", "09:00", "10:30", "11:30", "12:30", "14:30", "15:30", "16:30"]

MAX_DAILY_WORKING_HOURS = 5
VALID_LAB_START_INDICES = [0, 2, 3, 5, 6]
SATURDAY_VALID_INDICES = [1, 2, 3] 

def create_individual(sessions, teachers, rooms, faculty_mapping, divisions, fixed_timings):
    timetable = []
    available_slots = []
    
    for slot_idx in range(len(SLOTS)):
        for day in DAYS:
            if day == 'Saturday' and slot_idx not in SATURDAY_VALID_INDICES:
                continue
            available_slots.append((day, slot_idx))
            
    labs = [s for s in sessions if s['duration'] > 1]
    theories = [s for s in sessions if s['duration'] == 1]
    
    random.shuffle(labs)
    random.shuffle(theories)
    
    occupied = {div['name']: set() for div in divisions}
    labs_per_day = {div['name']: {day: 0 for day in DAYS} for div in divisions}
    used_fixed = {div['name']: {} for div in divisions}
    # Pre-reserve fixed slots so labs don't steal them
    reserved_fixed = {div['name']: set() for div in divisions}
    for div_name, sub_timings in fixed_timings.items():
        if div_name not in reserved_fixed: continue
        for sub_id, slots in sub_timings.items():
            for f_slot in slots:
                f_day = f_slot.get('day', '')
                f_time = f_slot.get('time', '')
                if f_day and f_time in SLOTS:
                    f_idx = SLOTS.index(f_time)
                    if f_day == 'Saturday' and f_idx not in SATURDAY_VALID_INDICES: continue
                    reserved_fixed[div_name].add((f_day, f_idx))

    # Create randomized lab slots to prevent morning-only labs
    lab_slots = []
    for d in DAYS:
        if d == 'Saturday': continue
        for idx in VALID_LAB_START_INDICES:
            lab_slots.append((d, idx))
    random.shuffle(lab_slots)
    
    # Place labs
    for session in labs:
        placed = False
        div_name = session.get('division', 'DIV-A')
        
        # Try to place with 1-lab-per-day constraint
        for (day, slot_idx) in lab_slots:
            if labs_per_day[div_name][day] == 0:
                if (day, slot_idx) not in occupied[div_name] and (day, slot_idx + 1) not in occupied[div_name]:
                    if (day, slot_idx) not in reserved_fixed[div_name] and (day, slot_idx + 1) not in reserved_fixed[div_name]:
                        occupied[div_name].add((day, slot_idx))
                        occupied[div_name].add((day, slot_idx + 1))
                        labs_per_day[div_name][day] += 1
                        sub_id = str(session['subject'].get('_id'))
                        
                        if div_name in faculty_mapping:
                            fac_map = faculty_mapping.get(div_name, {}).get(sub_id, {})
                        else:
                            fac_map = faculty_mapping.get(sub_id, {})
                            
                        facs = [t for t in teachers if str(t.get('_id')) in fac_map.get('lab', [])]
                        if len(facs) == 0: facs = [random.choice(teachers)]
                        
                        timetable.append({
                            "session": session, "day": day, "slot_idx": slot_idx,
                            "teacher": facs, "room": random.choice(rooms)
                        })
                        placed = True
                        break
                    
        # Fallback if impossible (ignore 1-lab-per-day)
        if not placed:
            for (day, slot_idx) in lab_slots:
                if (day, slot_idx) not in occupied[div_name] and (day, slot_idx + 1) not in occupied[div_name]:
                    if (day, slot_idx) not in reserved_fixed[div_name] and (day, slot_idx + 1) not in reserved_fixed[div_name]:
                        occupied[div_name].add((day, slot_idx))
                        occupied[div_name].add((day, slot_idx + 1))
                        labs_per_day[div_name][day] += 1
                        sub_id = str(session['subject'].get('_id'))
                        
                        if div_name in faculty_mapping:
                            fac_map = faculty_mapping.get(div_name, {}).get(sub_id, {})
                        else:
                            fac_map = faculty_mapping.get(sub_id, {})
                            
                        facs = [t for t in teachers if str(t.get('_id')) in fac_map.get('lab', [])]
                        if len(facs) == 0: facs = [random.choice(teachers)]
                        
                        timetable.append({
                            "session": session, "day": day, "slot_idx": slot_idx,
                            "teacher": facs, "room": random.choice(rooms)
                        })
                        placed = True
                        break

    # Place theories
    for session in theories:
        div_name = session.get('division', 'DIV-A')
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
                valid = True
                if f_day == 'Saturday' and f_idx not in SATURDAY_VALID_INDICES: valid = False
                
                if valid and (f_day, f_idx) not in occupied[div_name]:
                    occupied[div_name].add((f_day, f_idx))
                    if div_name in faculty_mapping:
                        fac_map = faculty_mapping.get(div_name, {}).get(sub_id, {})
                    else:
                        fac_map = faculty_mapping.get(sub_id, {})
                        
                    th_fac = fac_map.get('theory', '')
                    facs = [t for t in teachers if str(t.get('_id')) == th_fac]
                    if len(facs) == 0: facs = [random.choice(teachers)]
                    
                    timetable.append({
                        "session": session, "day": f_day, "slot_idx": f_idx,
                        "teacher": facs[0], "room": random.choice(rooms),
                        "fixed": True
                    })
                    placed = True
                    
        if not placed:
            for (day, slot_idx) in available_slots:
                if (day, slot_idx) not in occupied[div_name]:
                    occupied[div_name].add((day, slot_idx))
                    sub_id = str(session['subject'].get('_id'))
                    
                    if div_name in faculty_mapping:
                        fac_map = faculty_mapping.get(div_name, {}).get(sub_id, {})
                    else:
                        fac_map = faculty_mapping.get(sub_id, {})
                        
                    th_fac = fac_map.get('theory', '')
                    facs = [t for t in teachers if str(t.get('_id')) == th_fac]
                    if len(facs) == 0: facs = [random.choice(teachers)]
                    
                    timetable.append({
                        "session": session, "day": day, "slot_idx": slot_idx,
                        "teacher": facs[0], "room": random.choice(rooms)
                    })
                    break
                
    return timetable

def calculate_fitness(individual, teachers, faculty_max_workloads):
    conflicts = 0
    teacher_schedule = {}
    room_schedule = {}
    
    teacher_daily_hours = {}
    teacher_weekly_hours = {}
    
    teachers_map = {str(t.get('_id')): t for t in teachers}
    
    for entry in individual:
        faculties = entry['teacher'] if isinstance(entry['teacher'], list) else [entry['teacher']]
        r_id = entry['room'].get('_id', 'unknown')
        day = entry['day']
        
        for i in range(entry['session']['duration']):
            slot_key = f"{day}_{entry['slot_idx'] + i}"
            
            for fac in faculties:
                t_id = str(fac.get('_id', 'unknown'))
                
                if t_id not in teacher_schedule:
                    teacher_schedule[t_id] = set()
                if slot_key in teacher_schedule[t_id]:
                    conflicts += 2
                teacher_schedule[t_id].add(slot_key)
                
                if t_id not in teacher_daily_hours: teacher_daily_hours[t_id] = {}
                if day not in teacher_daily_hours[t_id]: teacher_daily_hours[t_id][day] = 0
                teacher_daily_hours[t_id][day] += 1
                if teacher_daily_hours[t_id][day] > MAX_DAILY_WORKING_HOURS:
                    conflicts += 1
                    
                if t_id not in teacher_weekly_hours:
                    t_obj = teachers_map.get(t_id, {})
                    teacher_weekly_hours[t_id] = t_obj.get('currentWorkload', 0)
                    
                teacher_weekly_hours[t_id] += 1
                max_week = faculty_max_workloads.get(t_id, teachers_map.get(t_id, {}).get('maxWorkloadPerWeek', 30))
                if teacher_weekly_hours[t_id] > max_week:
                    conflicts += 1
            
            if r_id not in room_schedule:
                room_schedule[r_id] = set()
            if slot_key in room_schedule[r_id]:
                conflicts += 2
            room_schedule[r_id].add(slot_key)
            
    return conflicts

def crossover(parent1, parent2):
    split = len(parent1) // 2
    return parent1[:split] + parent2[split:]

def mutate(individual, teachers, rooms, faculty_mapping):
    if not individual: return individual
    idx1 = random.randint(0, len(individual) - 1)
    idx2 = random.randint(0, len(individual) - 1)
    
    if individual[idx1].get('fixed') or individual[idx2].get('fixed'):
        return individual
        
    if individual[idx1]['session']['duration'] == 1 and individual[idx2]['session']['duration'] == 1:
        if individual[idx1]['session'].get('division') == individual[idx2]['session'].get('division'):
            individual[idx1]['day'], individual[idx2]['day'] = individual[idx2]['day'], individual[idx1]['day']
            individual[idx1]['slot_idx'], individual[idx2]['slot_idx'] = individual[idx2]['slot_idx'], individual[idx1]['slot_idx']
        
    return individual

@app.get("/")
def read_root(): return {"status": "ML Engine is running"}

@app.post("/api/ml/generate")
def generate_timetable(request: GenerationRequest):
    start_time = time.time()
    
    sessions = []
    divs = request.divisions if request.divisions else [{"name": "DIV-A", "strength": 60}]
    
    for div in divs:
        for sub in request.subjects:
            lectures = sub.get("lectureHours", 0) + sub.get("tutorialHours", 0)
            for _ in range(lectures):
                sessions.append({"subject": sub, "type": "theory", "duration": 1, "division": div['name']})
                
            labs = sub.get("practicalHours", 0)
            if labs > 0:
                for _ in range(max(1, labs // 2)):
                    sessions.append({"subject": sub, "type": "lab", "duration": 2, "division": div['name']})

    POPULATION_SIZE = 100
    GENERATIONS = 300 
    
    population = [create_individual(sessions, request.teachers, request.rooms, request.facultyMapping, divs, request.fixedTimings) for _ in range(POPULATION_SIZE)]
    
    best_individual = None
    best_fitness = float('inf')
    
    for gen in range(GENERATIONS):
        scored = [(calculate_fitness(ind, request.teachers, request.facultyMaxWorkloads), ind) for ind in population]
        scored.sort(key=lambda x: x[0])
        
        if scored[0][0] < best_fitness:
            best_fitness = scored[0][0]
            best_individual = scored[0][1]
            
        if best_fitness == 0: break 
            
        survivors = [x[1] for x in scored[:POPULATION_SIZE//2]]
        new_population = survivors.copy()
        
        while len(new_population) < POPULATION_SIZE:
            p1 = random.choice(survivors)
            p2 = random.choice(survivors)
            child = crossover(p1, p2)
            if random.random() < 0.2: 
                child = mutate(child, request.teachers, request.rooms, request.facultyMapping)
            new_population.append(child)
            
        population = new_population

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
