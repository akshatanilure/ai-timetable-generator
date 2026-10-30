Dynamic Timetable Generator

An academic timetable management and generation system that combines a React-based web interface, a Node.js/Express backend, MongoDB for data storage, and a Python FastAPI scheduling engine. The scheduling engine uses a Genetic Algorithm to search for timetable arrangements while considering the academic data and constraints supplied by the application.
Overview
Creating an academic timetable manually can be time-consuming because departments need to coordinate subjects, teachers, classrooms, laboratories, divisions, batches, faculty workload and scheduling rules. This project provides a central application to manage this information and generate timetables automatically.
Main capabilities
- Role-based application access with authentication.
- Admin-facing management of teachers, subjects, rooms, labs, divisions, batches and constraints.
- Timetable generation using the Python scheduling service.
- Timetable views for administrators, teachers and students.
- Conflict reporting and timetable validation.
- Faculty workload and historical teacher-subject experience data management.
- Timetable settings such as semester, branch, start time and scheduling rules.
The actual scheduling result depends on the input data and constraints configured in the application. Review generated timetables before using them as official schedules.

Technology stack
Layer	Technologies
Frontend	React, React Router, Axios, Tailwind CSS, React Icons
Backend/API	Node.js, Express.js
Database	MongoDB, Mongoose
Authentication and security	JSON Web Tokens (JWT), bcryptjs, Helmet
Scheduling service	Python, FastAPI, Pydantic
Optimization	Genetic Algorithm implemented in Python; DEAP is included in the ML-engine requirements
Supporting libraries	NumPy, Uvicorn


Architecture
                   React Frontend
                         |
                   HTTP / REST API
                         |
                Node.js + Express API
                    /          \
                   /            \
              MongoDB       Python FastAPI
             (application     Scheduling API
                data)             |
                             Genetic Algorithm
                             - Initial population
                             - Fitness evaluation
                             - Selection
                             - Crossover
                             - Mutation
                             - Best candidate timetable
The frontend sends requests to the Express API. The backend stores and retrieves application data from MongoDB. For timetable generation, the backend sends the required scheduling data to the Python service at http://127.0.0.1:8000/api/ml/generate. The Python service evaluates timetable candidates and returns a generated schedule and conflict information to the backend.
Scheduling approach
The Python service represents candidate timetables as individuals and evaluates them with a fitness function. It then iteratively improves the population using Genetic Algorithm operations such as crossover and mutation, retaining better candidates based on fitness. The implementation also contains scheduling logic for semester timings, theory sessions, labs, electives, rooms, teachers and existing timetable bookings.

The goal of fitness evaluation is to reduce scheduling conflicts and produce a timetable that better satisfies the supplied rules. The algorithm is an optimization approach; it does not guarantee a globally optimal timetable for every possible input.
Project structure
ai-timetable-generator/
├── frontend/                 # React user interface
│   ├── public/
│   └── src/
│       ├── components/       # Shared UI components
│       ├── context/          # Authentication context
│       ├── layouts/          # Dashboard layout
│       ├── pages/             # Admin, teacher, student and shared pages
│       ├── routes/            # Route protection and dashboard routes
│       └── services/          # API and authentication services
├── src/                      # Node.js/Express backend
│   ├── config/                # Database configuration
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Authentication and error handling
│   ├── models/                # Mongoose schemas
│   ├── routes/                # REST API routes
│   └── server.js              # Backend entry point
├── timetable-ml-engine/       # Python FastAPI scheduling engine
│   ├── main.py
│   └── requirements.txt
├── data/                      # Historical allotment and experience data
├── package.json               # Backend dependencies and scripts
└── README.md

Features of AI Timetable Generator
1. Role-Based Login – Separate access for Admin, Teachers and Students.
2. Faculty Management – Add, update and manage teacher details, subjects and workload.
3. Subject Management – Manage subjects, credits, semester and department details.
4. Automatic Timetable Generation – Generate academic timetables using a Genetic Algorithm.
5. Constraint Management – Configure scheduling rules such as working days, time slots and consecutive lectures.
6. Conflict Detection – Identify teacher, classroom and timetable scheduling conflicts.
7. Lab Scheduling – Allocate laboratories and schedule practical sessions.
8. Batch and Division Management – Organize students based on branches, semesters, divisions and batches.
9. Faculty Workload Balancing – Distribute teaching hours among faculty members.
10. Teacher Timetable View – Allow teachers to view their individual schedules.
11. Student Timetable View – Allow students to view their class schedules.
12. Room Utilization – View classroom usage and availability.
13. Conflict and Integrity Reports – Display scheduling conflicts and validation information.
14. Historical Experience Data – Use previous teacher-subject experience information in scheduling.

