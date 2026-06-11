# Sofia's TaskFlow - Multi-User Task Management System

A responsive, full-stack task management web application built for Azentrix Full Stack Developer Intern Task 2. Sofia's TaskFlow provides teams with a collaborative workspace to create project boards, manage tasks, assign responsibilities, track progress, and stay synchronized through real-time updates.

## Default Login

### Admin Account

- Username: `admin`
- Password: `Admin@123`

### Member Account

- Username: `user`
- Password: `User@123`

## Features

- User registration and login
- JWT-style authentication and session management
- Admin and member role-based access control
- Create, open, and delete project boards
- Multiple default project boards with sample tasks
- To Do, In Progress, and Done Kanban workflow
- Add, edit, and delete task cards
- Assign tasks to team members
- Track task priority and due dates
- Drag-and-drop card movement between columns
- Admin user management dashboard
- Search tasks by title or description
- Filter tasks by priority
- Real-time updates using WebSockets
- Activity log for important project actions
- Dashboard statistics and project summaries
- Persistent light and dark mode
- Persistent backend storage using a local JSON database
- Responsive desktop, tablet, and mobile layouts

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Native WebSocket API
- Crypto-based password hashing
- JWT-style authentication
- Local JSON database (`data/db.json`)

The project intentionally avoids third-party frameworks and packages. This keeps setup quick and makes the frontend, backend, authentication, API routes, WebSocket communication, and storage logic easy to review.

## Setup

1. Clone the repository using the requested Task 2 name:

```bash
git clone https://github.com/Sofia2200031904/azentrix-fullstack-task2.git
cd azentrix-fullstack-task2
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

4. Open:

```text
http://localhost:3000
```

5. Sign in using either the admin or member credentials listed above.

## Approach

The application follows a simple full-stack architecture:

- `public/index.html` contains the authentication screens, dashboard, project boards, task cards, admin panel, filters, and activity log.
- `public/styles.css` defines the visual design, responsive layouts, dark mode, and Kanban board styling.
- `public/app.js` manages authentication, API communication, board management, task operations, drag-and-drop functionality, filters, and real-time updates.
- `server.js` provides the backend API, authentication logic, role management, WebSocket communication, and data persistence.
- `data/db.json` stores users, boards, tasks, and activity logs.

The frontend and backend are served together from a single Node.js application. Updates made by one user are instantly reflected for other connected users through WebSocket broadcasting.

## Public Link

**https://azentrix-fullstack-task2-7xuw.onrender.com/**

Loom Demo Link:

**https://www.loom.com/share/266cfba5a2e44a57a75b24b234245126**

## Video Demo 


https://github.com/user-attachments/assets/19eb962d-6bda-4cb4-b113-4f8505ee7645


