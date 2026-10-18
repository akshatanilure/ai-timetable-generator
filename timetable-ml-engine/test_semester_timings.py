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
    
    # Test overrides
    print("\nTesting Custom Start Time Overrides...")
    s1_override = main.get_semester_timing_config(1, "09:00")
    assert s1_override[0] == 1, "Sem 1 overridden to 9:00 should have start_idx 1"
    assert 4 in s1_override[1], "Sem 1 overridden to 9:00 should allow 12:30"
    print("  Sem 1 overridden to 9:00 AM -> SUCCESS (starts at 9:00, 12:30 allowed)")

    s3_override = main.get_semester_timing_config(3, "08:00")
    assert s3_override[0] == 0, "Sem 3 overridden to 8:00 should have start_idx 0"
    assert 4 not in s3_override[1], "Sem 3 overridden to 8:00 should not allow 12:30"
    print("  Sem 3 overridden to 8:00 AM -> SUCCESS (starts at 8:00, 12:30 blocked)")
    print("\nALL OVERRIDE TESTS PASSED!")
else:
    print("\nVERIFICATION FAILED!")
