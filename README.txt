TEAM TASK MANAGER
=================
A full-stack team task management web application.

LIVE URL
--------
https://romantic-happiness-production-3eda.up.railway.app

GITHUB REPOSITORY
-----------------
https://github.com/shekshavali4689/team-task-manager

TECH STACK
----------
Frontend: React.js, Tailwind CSS, React Router
Backend: Node.js, Express.js
Database: PostgreSQL on Railway
ORM: Prisma
Authentication: JWT Tokens
Deployment: Railway

FEATURES
--------
1. User Authentication (Signup/Login)
2. Project Management (Create, View, Delete)
3. Team Management (Add/Remove members)
4. Task Management (Create, Assign, Update, Delete)
5. Role Based Access Control (Admin/Member)
6. Kanban Board (Todo, In Progress, Done)
7. Dashboard (Stats, Overdue tasks, Team overview)

ROLE BASED ACCESS
-----------------
Admin: Create projects, manage tasks, add/remove members
Member: View projects, update assigned task status only

HOW TO RUN LOCALLY
------------------
1. Clone: git clone https://github.com/shekshavali4689/team-task-manager
2. Backend: cd backend, npm install, add .env, npx prisma db push, npm run dev
3. Frontend: cd frontend, npm install, add .env, npm run dev
4. Open http://localhost:5173

DEPLOYMENT
----------
Backend: https://team-task-manager-production-c5c2.up.railway.app
Frontend: https://romantic-happiness-production-3eda.up.railway.app
