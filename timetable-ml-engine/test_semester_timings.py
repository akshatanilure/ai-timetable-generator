import main

print("Testing semester timing configurations...")

sem_cases = [
    (1, 0, False),  # Sem 1: 8:00 AM start, 12:30 slot NOT allowed for theory
    (2, 0, False),  # Sem 2: 8:00 AM start, 12:30 slot NOT allowed for theory
    (3, 1, True),   # Sem 3: 9:00 AM start, 12:30 slot ALLOWED for theory
    (4, 1, True),   # Sem 4: 9:00 AM start, 12:30 slot ALLOWED for theory
    (5, 0, False),  # Sem 5: 8:00 AM start, 12:30 slot NOT allowed for theory
    (6, 1, True),   # Sem 6: 9:00 AM start, 12:30 slot ALLOWED for theory
    (7, 1, True),   # Sem 7: 9:00 AM start, 12:30 slot ALLOWED for theory
    (8, 1, True),   # Sem 8: 9:00 AM start, 12:30 slot ALLOWED for theory
]

all_passed = True
for sem, expected_start_idx, expected_1230_allowed in sem_cases:
    start_idx, allowed_theory, valid_lab_start, sat_valid = main.get_semester_timing_config(sem)
    has_0800 = 0 in allowed_theory
    has_0900 = 1 in allowed_theory
    has_1230 = 4 in allowed_theory
    
    start_time_str = "8:00 AM" if start_idx == 0 else "9:00 AM"
    
    print(f"Sem {sem}: Start = {start_time_str} (idx={start_idx}), 08:00 allowed = {has_0800}, 12:30 allowed = {has_1230}")
    
    if start_idx != expected_start_idx:
        print(f"  [ERROR] Expected start_idx {expected_start_idx}, got {start_idx}")
        all_passed = False
    if has_1230 != expected_1230_allowed:
        print(f"  [ERROR] Expected 12:30 allowed {expected_1230_allowed}, got {has_1230}")
        all_passed = False

if all_passed:
    print("\nALL SEMESTER TIMING RULES VERIFIED SUCCESSFULLY!")
else:
    print("\nVERIFICATION FAILED!")
