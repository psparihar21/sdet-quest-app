/**
 * Practice database: a small HRMS / workforce-management dataset (leave, attendance, payroll),
 * the domain SDET Quest's capstone project ("LeaveFlow") also uses.
 * Rebuilt from scratch on every run, so learners can't break it.
 */
export const SQL_SEED = `
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  manager_id INTEGER
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  department_id INTEGER REFERENCES departments(id),
  manager_id INTEGER REFERENCES employees(id),
  salary INTEGER NOT NULL,
  joined_on TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','EXITED'))
);

CREATE TABLE leave_requests (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  leave_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
  approver_id INTEGER REFERENCES employees(id)
);

CREATE TABLE leave_balances (
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  leave_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  granted REAL NOT NULL,
  used REAL NOT NULL,
  PRIMARY KEY (employee_id, leave_type, year)
);

CREATE TABLE attendance (
  id INTEGER PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  work_date TEXT NOT NULL,
  first_in TEXT,
  last_out TEXT,
  status TEXT NOT NULL CHECK (status IN ('PRESENT','ABSENT','ON_LEAVE','HALF_DAY'))
);

INSERT INTO departments VALUES
 (1,'Engineering',1),(2,'Quality',4),(3,'Payroll',7),(4,'People Ops',9),(5,'Design',NULL);

INSERT INTO employees VALUES
 (1,'Asha Rao','asha@leaveflow.test',1,NULL,240000,'2018-04-02','ACTIVE'),
 (2,'Vikram Shah','vikram@leaveflow.test',1,1,160000,'2020-07-15','ACTIVE'),
 (3,'Neha Gupta','neha@leaveflow.test',1,1,150000,'2021-01-11','ACTIVE'),
 (4,'Rohan Mehta','rohan@leaveflow.test',2,1,170000,'2019-09-23','ACTIVE'),
 (5,'Priya Nair','priya@leaveflow.test',2,4,120000,'2022-03-01','ACTIVE'),
 (6,'Karan Patel','karan@leaveflow.test',2,4,120000,'2023-06-19','ACTIVE'),
 (7,'Meera Iyer','meera@leaveflow.test',3,1,180000,'2017-11-06','ACTIVE'),
 (8,'Arjun Das','arjun@leaveflow.test',3,7,110000,'2024-02-12','ACTIVE'),
 (9,'Sara Khan','sara@leaveflow.test',4,1,140000,'2019-05-20','ACTIVE'),
 (10,'Dev Malhotra','dev@leaveflow.test',2,4,95000,'2021-08-30','EXITED'),
 (11,'Isha Verma','isha@leaveflow.test',NULL,9,90000,'2025-01-06','ACTIVE');

INSERT INTO leave_requests VALUES
 (1,2,'CASUAL','2026-03-02','2026-03-03',2,'APPROVED',1),
 (2,3,'SICK','2026-03-10','2026-03-10',1,'APPROVED',1),
 (3,5,'EARNED','2026-04-06','2026-04-10',5,'APPROVED',4),
 (4,5,'CASUAL','2026-05-18','2026-05-18',1,'PENDING',4),
 (5,6,'SICK','2026-04-21','2026-04-22',2,'REJECTED',4),
 (6,6,'CASUAL','2026-06-01','2026-06-02',2,'APPROVED',4),
 (7,8,'EARNED','2026-06-15','2026-06-19',5,'PENDING',7),
 (8,2,'EARNED','2026-07-06','2026-07-10',5,'APPROVED',1),
 (9,9,'CASUAL','2026-07-20','2026-07-20',0.5,'APPROVED',1),
 (10,4,'SICK','2026-08-03','2026-08-04',2,'CANCELLED',1),
 (11,3,'EARNED','2026-08-10','2026-08-12',3,'APPROVED',1),
 (12,5,'SICK','2026-08-17','2026-08-17',1,'APPROVED',4);

INSERT INTO leave_balances VALUES
 (2,'CASUAL',2026,12,2),(2,'EARNED',2026,18,5),(3,'SICK',2026,8,1),(3,'EARNED',2026,18,3),
 (5,'EARNED',2026,18,5),(5,'CASUAL',2026,12,0),(5,'SICK',2026,8,1),(6,'CASUAL',2026,12,2),(6,'SICK',2026,8,0),
 (8,'EARNED',2026,18,5),(9,'CASUAL',2026,12,0.5),(4,'SICK',2026,8,3);

INSERT INTO attendance VALUES
 (1,2,'2026-08-03','09:12','18:40','PRESENT'),(2,3,'2026-08-03','09:41','18:05','PRESENT'),
 (3,5,'2026-08-03','09:05','13:10','HALF_DAY'),(4,6,'2026-08-03',NULL,NULL,'ABSENT'),
 (5,8,'2026-08-03','10:02','19:15','PRESENT'),(6,4,'2026-08-03',NULL,NULL,'ON_LEAVE'),
 (7,2,'2026-08-04','09:25','18:30','PRESENT'),(8,3,'2026-08-04','09:29','18:01','PRESENT'),
 (9,5,'2026-08-04','09:31','18:22','PRESENT'),(10,6,'2026-08-04','09:58','18:47','PRESENT'),
 (11,8,'2026-08-04','09:20',NULL,'PRESENT'),(12,4,'2026-08-04',NULL,NULL,'ON_LEAVE'),
 (13,2,'2026-08-04','09:25','18:30','PRESENT');
`;

export const SQL_SCHEMA_SUMMARY = `departments(id, name, manager_id)
employees(id, name, email, department_id, manager_id, salary, joined_on, status)
leave_requests(id, employee_id, leave_type, start_date, end_date, days, status, approver_id)
leave_balances(employee_id, leave_type, year, granted, used)
attendance(id, employee_id, work_date, first_in, last_out, status)`;
