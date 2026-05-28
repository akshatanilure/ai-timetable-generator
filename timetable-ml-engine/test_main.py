import json
from main import generate_timetable
from pydantic import BaseModel

class DummyReq:
    def __init__(self):
        self.subjects = [{"_id": "1", "lectureHours": 1}]
        self.teachers = [{"_id": "1"}]
        self.rooms = [{"_id": "1"}]
        self.constraints = {}
        self.facultyMapping = {}
        self.divisions = [{"name": "DIV-A", "strength": 60}]
        self.facultyMaxWorkloads = {}
        self.fixedTimings = {}
        self.semester = 1

req = DummyReq()
generate_timetable(req)
