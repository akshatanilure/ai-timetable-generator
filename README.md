# AI Timetable Generator

## Project Overview

The **AI Timetable Generator** is a web-based application designed to automate academic timetable creation using a hybrid architecture combining React, Node.js, Express.js, MongoDB, Python FastAPI and Genetic Algorithm optimization.

The system generates academic timetables while considering faculty availability, subjects, classrooms, batches, semester requirements and scheduling constraints. It aims to minimize scheduling conflicts and improve faculty workload distribution.

## Features

1. **Role-Based Authentication** – Separate login and access for Admin, Teachers and Students.
2. **Faculty Management** – Add, update and manage faculty details, subjects and workload.
3. **Subject Management** – Manage subjects, credits and semester details.
4. **Automatic Timetable Generation** – Generate timetables using a Genetic Algorithm.
5. **Constraint-Based Scheduling** – Consider semester timings, theory sessions, labs, electives and scheduling rules.
6. **Conflict Detection** – Identify teacher, classroom and timetable scheduling conflicts.
7. **Lab Scheduling** – Schedule practical sessions and allocate laboratories.
8. **Batch Management** – Organize students based on departments, semesters and batches.
9. **Faculty Workload Management** – Distribute teaching hours among faculty members.
10. **Teacher Dashboard** – Allow teachers to view their individual timetables.
11. **Student Dashboard** – Allow students to view their class schedules.
12. **Room Management** – Manage classroom allocation and availability.
13. **Conflict Reports** – Display timetable validation results and scheduling conflicts.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Scheduling Engine | Python, FastAPI |
| Optimization Algorithm | Genetic Algorithm |
| Authentication | JWT, bcrypt |
| API Communication | REST APIs, Axios |

## System Architecture

The project follows a hybrid architecture with three major components:

**1. React Frontend**
- Provides user interfaces for Admin, Teachers and Students.
- Displays dashboards, timetable information and reports.
- Communicates with the backend through REST APIs.

**2. Node.js and Express Backend**
- Handles authentication and authorization.
- Manages users, faculty, subjects, classrooms and timetable data.
- Connects the frontend with the database and Python scheduling engine.

**3. Python FastAPI Scheduling Engine**
- Generates candidate timetables.
- Evaluates candidates using a fitness function.
- Improves timetable solutions using Genetic Algorithm operations such as selection, crossover and mutation.
- Considers scheduling constraints to reduce conflicts.

## Genetic Algorithm Approach

The Python scheduling engine uses a Genetic Algorithm to optimize timetable generation.

The process involves:

1. **Initial Population:** Generate multiple candidate timetables.
2. **Fitness Evaluation:** Evaluate each timetable based on scheduling constraints and conflicts.
3. **Selection:** Select better-performing candidates based on fitness.
4. **Crossover:** Combine selected candidates to generate new timetable solutions.
5. **Mutation:** Introduce small changes to explore alternative scheduling arrangements.
6. **Iteration:** Repeat the process to improve the population and obtain better timetable solutions.

The goal of fitness evaluation is to reduce scheduling conflicts and produce a timetable that better satisfies the supplied rules.

The algorithm is an optimization approach and does not guarantee a globally optimal timetable for every possible input.

## Features of the Project

### 1. Role-Based Authentication
- Separate login access for Admin, Teachers and Students.
- Role-based dashboards and access permissions.

### 2. Faculty Management
- Add, update and manage faculty details.
- Assign subjects and manage faculty workload.
- Consider teacher availability during scheduling.

### 3. Subject Management
- Manage subjects, semesters and academic details.
- Support theory sessions, practical sessions and electives.

### 4. Automatic Timetable Generation
- Generate academic timetables automatically using a Genetic Algorithm.
- Create multiple candidate timetables and evaluate them using a fitness function.
- Improve solutions through selection, crossover and mutation.

### 5. Constraint-Based Scheduling
- Consider semester timings and available time slots.
- Schedule theory classes and laboratory sessions.
- Handle classrooms, teachers, electives and existing timetable bookings.

### 6. Conflict Detection
- Identify teacher scheduling conflicts.
- Detect classroom allocation conflicts.
- Validate timetable constraints to reduce overlapping sessions.

### 7. Laboratory Scheduling
- Allocate laboratories for practical sessions.
- Support continuous lab scheduling based on academic requirements.

### 8. Faculty Workload Management
- Distribute teaching hours among faculty members.
- Consider faculty workload while generating timetables.

### 9. Admin Dashboard
- Manage teachers, students, subjects and academic information.
- Generate and manage timetables.
- View scheduling conflicts and reports.

### 10. Teacher Dashboard
- View individual teaching schedules.
- Access assigned subjects and timetable details.

### 11. Student Dashboard
- View class timetables.
- Access semester and academic schedule information.

### 12. Timetable Validation and Reports
- Evaluate generated timetables.
- Display scheduling conflicts and validation results.
- Help administrators identify timetable-related issues.

## Future Enhancements

- Improve scheduling efficiency for larger institutions.
- Introduce dynamic timetable updates.
- Enhance optimization using advanced algorithms.
- Add notifications for timetable changes.
- Improve timetable analytics and reporting.

## Conclusion

The AI Timetable Generator aims to automate academic scheduling, reduce manual effort, minimize timetable conflicts and improve faculty workload distribution through intelligent optimization techniques.
