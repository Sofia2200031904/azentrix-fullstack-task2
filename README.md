# Sofia's TaskFlow - Multi-User Task Management System

A responsive, full-stack task management web app built for Azentrix Full Stack Developer Intern Task 2. Sofia's TaskFlow gives teams a focused workspace to create project boards, manage tasks, assign work, track progress, and collaborate with real-time updates.

## Default Login

Admin Username: `admin`  
Admin Password: `Admin@123`

Member Username: `user`  
Member Password: `User@123`

## Features

- User registration and login
- JWT-style authentication with token-based sessions
- Admin and member roles
- Create, open, and delete project boards
- 9 default project boards with sample tasks
- To Do, In Progress, and Done Kanban columns
- Add, edit, and delete task cards
- Record task title, description, assignee, due date, and priority
- Drag and drop cards between columns
- Admin can manage all cards and users
- Members can manage only their own or assigned cards
- Add, edit, delete, and role-update users from the admin panel
- Real-time workspace updates with WebSockets
- Search tasks by title or description
- Filter tasks by priority
- Dashboard summary with total cards, completed cards, and users
- Activity log for important project actions
- Persistent light and dark modes
- Persistent backend data with a local JSON database
- Responsive desktop, tablet, and mobile layouts

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js HTTP server
- Native WebSocket protocol
- Crypto-based password hashing
- Signed JWT-style authentication
- Local JSON file database using `data/db.json`

The project intentionally uses no third-party npm package. This keeps setup quick and makes the frontend, backend, authentication, API routes, WebSocket handling, and storage logic easy to review.

## Setup

Clone the repository using the requested Task 2 name:

```bash
git clone https://github.com/Sofia2200031904/azentrix-fullstack-task2.git
cd azentrix-fullstack-task2
```

Start the full-stack Node app:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Sign in using:

```text
admin / Admin@123
```

or:

```text
user / User@123
```

Optional environment variables:

```text
PORT=3000
JWT_SECRET=replace-with-a-long-random-secret
```

## Approach

The app is organized into a small full-stack structure:

- `public/index.html` contains the login screen, registration form, workspace layout, board area, card form, admin panel, filters, and activity log.
- `public/styles.css` defines the visual design, dark mode, board layout, draggable cards, responsive breakpoints, and dashboard styling.
- `public/app.js` manages frontend authentication, API calls, board rendering, card CRUD operations, drag-and-drop behavior, filters, WebSocket updates, and UI state.
- `server.js` contains the backend HTTP server, static file serving, authentication, API routes, password hashing, signed token handling, WebSocket broadcasting, role permissions, and JSON database persistence.
- `data/db.json` stores users, boards, cards, and activity logs.

The frontend and backend are served together from one Node app. The backend updates `data/db.json` whenever users, boards, cards, or roles change. The frontend refreshes automatically when the backend broadcasts workspace changes through WebSockets.

## Default Project Boards

- Website Redesign
- Marketing Team
- Mobile App
- Product Roadmap
- Customer Support
- Sales Pipeline
- Content Calendar
- QA Testing
- DevOps Automation

## Important Note For Drag And Drop

Admin can drag every card. Members can drag only cards they created or cards assigned to them. If a card shows a view-only permission message, drag-and-drop is intentionally disabled for that member.

## API Routes

```text
POST   /api/register
POST   /api/login
POST   /api/logout
GET    /api/me
GET    /api/boards
GET    /api/boards/:boardId
POST   /api/boards
DELETE /api/boards/:boardId
POST   /api/boards/:boardId/cards
PUT    /api/cards/:cardId
DELETE /api/cards/:cardId
POST   /api/cards/move
POST   /api/users
PUT    /api/users/:userId
DELETE /api/users/:userId
```

## Deployment

This project deploys the frontend and backend together as one Node web service.

Recommended Render settings:

```text
Build Command: npm install
Start Command: npm start
```

Add this environment variable:

```text
JWT_SECRET=your-long-random-secret
```

## Public Link

GitHub Repository: https://github.com/Sofia2200031904/azentrix-fullstack-task2

Live Demo: Add your deployed Render or Railway link here after deployment.

## Video Demo

Demo video file:

```text
TaskFlow_Demo_Video.mp4
```

Loom demo link: Add your Loom link here after uploading or recording.

## Screenshots

![Login demo](screenshots/login-demo.svg)

![Board and admin demo](screenshots/board-demo.svg)
