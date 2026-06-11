# Azentrix Fullstack Task 2 - Multi-User Task Management System

TaskFlow is a self-hostable mini Trello for remote teams. It includes registration/login, JWT-style authentication, multiple boards, draggable Kanban cards, admin user management, role-based permissions, and near real-time updates with WebSockets.

## Live Demo

Paste your deployed links after publishing:

```text
Live Demo: https://your-taskflow-app.onrender.com
API: https://your-taskflow-app.onrender.com/api/boards
Loom Video: https://loom.com/share/your-video-id
```

This project serves the frontend and backend from one Node app, so one Render/Railway deployment is enough. You can still deploy frontend/backend separately later if you split `public/` and `server.js`.

## Demo Credentials

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `Admin@123` |
| Member | `user` | `User@123` |

New users can register from the registration panel. Registered users are members by default.

## Default Data Included

The app starts with useful sample data so the demo does not look empty.

Default users:

| Name | Username | Role | Password |
| --- | --- | --- | --- |
| Admin | `admin` | Admin | `Admin@123` |
| User | `user` | Member | `User@123` |

Default boards:

| Board | Sample Cards |
| --- | --- |
| Website Redesign | Finalize sprint goals, Write onboarding checklist, Review API errors, Create project board |
| Marketing Team | Plan launch campaign, Schedule social posts, Collect brand assets |
| Mobile App | Design onboarding wireframes, Build push notification settings, Prepare beta release notes |
| Product Roadmap | Interview power users, Draft roadmap specs, Prioritize feature votes |
| Customer Support | Triage open tickets, Update help center article, Summarize feedback themes |
| Sales Pipeline | Qualify inbound leads, Prepare pricing proposals, Send follow-up emails |
| Content Calendar | Pick blog topics, Draft launch blog, Publish newsletter |
| QA Testing | Run regression checklist, Verify bug fixes, Complete release sign-off |
| DevOps Automation | Document environment variables, Check deployment pipeline, Back up demo data |

The default data is created automatically in `data/db.json` the first time the server runs. If `data/db.json` already exists, the app keeps existing users/cards and adds any missing default demo cards.

## Feature Checklist

| Requirement | Status |
| --- | --- |
| User registration | Done |
| User login | Done |
| JWT-style auth token | Done |
| Backend API | Done |
| Persistent storage | Done with local JSON file |
| Multiple boards | Done |
| Board create/delete/open | Done |
| To Do / In Progress / Done columns | Done |
| Draggable cards | Done |
| Title, description, assignee, due date, priority | Done |
| Real-time updates | Done with WebSockets |
| Admin user management | Done |
| Add/edit/delete users | Done |
| Assign Admin/Member role | Done |
| Member card permissions | Done |
| Search and priority filter | Bonus done |
| Dark mode | Bonus done |
| Activity log | Bonus done |
| Dashboard statistics | Bonus done |

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js HTTP server
- Realtime: Native WebSocket protocol
- Authentication: signed JWT-style token stored in localStorage and HttpOnly cookie
- Database: `data/db.json` local JSON persistence

No external npm packages are required, so setup is very fast.

## Do We Need A Separate Database?

No, a separate database is not required for this submission.

This project already has a backend and stores data in a local JSON file:

```text
data/db.json
```

That means users, boards, cards, roles, and activity logs are saved even after restarting the local server. For the internship demo, this is enough because the task says the app should be self-hostable and does not strictly require MongoDB.

Use MongoDB Atlas only if you want stronger production persistence on free hosting. If you deploy to Render free tier, local JSON can work for the demo, but some free hosts may reset local files after redeploys or restarts. For a simple internship submission, you can write in README:

```text
Database: Local JSON file storage using data/db.json.
No external database setup is required to run the project locally.
MongoDB Atlas can be connected later for production persistence.
```

## Run Locally

Install Node.js 18 or newer.

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Optional environment variables:

```bash
PORT=3000
JWT_SECRET=replace-with-a-long-random-secret
```

## Important Test Steps

### Registration

1. Open `http://localhost:3000`.
2. Use the Register Member form.
3. A new member account is created and logged in automatically.

### Admin Panel

1. Log in as `admin` / `Admin@123`.
2. Open the Admin Users section.
3. Add a user, edit the user name/role/password, then delete the user.

### Multiple Boards

1. Log in.
2. Use the Boards form to create boards like `Website Redesign`, `Marketing Team`, and `Mobile App`.
3. Click a board name to open it.
4. Delete a board with the Delete button. At least one board must remain.

### Real-Time Updates

1. Open Browser 1 and log in as admin.
2. Open Browser 2 or an incognito window and log in as user.
3. Keep both browsers on the same board.
4. Create, edit, delete, or drag a card in Browser 1.
5. Browser 2 updates automatically without refresh.

### Role Permissions

1. Log in as admin and create a card assigned to admin.
2. Log in as user.
3. The user can see the admin card but cannot edit, delete, or drag it unless assigned to that card.
4. Admin can manage all cards.

### Drag And Drop Notes

- Log in as `admin` / `Admin@123` to test drag-and-drop on every card.
- Members can drag only cards they created or cards assigned to them.
- If a card shows the view-only permission note, drag is intentionally disabled for that user.
- Drag a card over another column and release it anywhere inside the column.

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

## Backend / Database Connection

This submission uses a local JSON database at:

```text
data/db.json
```

That file persists users, boards, cards, and activity logs across server restarts on the same machine.

For production free-tier deployment, local JSON storage is acceptable for a small self-hosted demo but can reset if the hosting platform uses an ephemeral filesystem.

You do not need MongoDB to run or submit this project. If an evaluator asks where the database is, answer:

```text
The backend stores application data in data/db.json. It is a lightweight file database suitable for a self-hosted demo. The server creates and updates this file automatically.
```

To connect MongoDB Atlas later:

1. Create a MongoDB Atlas cluster.
2. Add an environment variable:

```text
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/taskflow
```

3. Replace the `loadData()` and `saveData()` functions in `server.js` with MongoDB collection calls for `users`, `boards`, `cards`, and `activity`.
4. Keep the same API route names so the frontend does not need major changes.

## Deploy On Render

1. Push the project to GitHub using this repository name:

```text
azentrix-fullstack-task2
```

2. Go to Render and create a new Web Service.
3. Connect your GitHub repository.
4. Use these settings:

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

5. Add environment variable:

```text
JWT_SECRET=your-long-random-secret
```

6. Deploy.
7. Copy the Render URL into the Live Demo section.

After deployment, test:

```text
https://your-app-name.onrender.com
https://your-app-name.onrender.com/api/boards
```

The `/api/boards` URL requires login token in normal browser use, so the main live demo link is the most important link to share.

## Deploy On Railway

Railway also works because this is a single Node app.

1. Push the project to GitHub.
2. Open Railway and create a new project.
3. Choose Deploy from GitHub Repo.
4. Select `azentrix-fullstack-task2`.
5. Add environment variable:

```text
JWT_SECRET=your-long-random-secret
```

6. Railway should detect Node automatically.
7. Set start command if asked:

```text
npm start
```

8. Copy the generated Railway URL into the README.

## Upload To GitHub

Run these commands from the project folder:

```bash
git init
git add .
git commit -m "Build Azentrix fullstack task management app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/azentrix-fullstack-task2.git
git push -u origin main
```

If Git says the remote already exists:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/azentrix-fullstack-task2.git
git push -u origin main
```

If Git is not installed, install it from:

```text
https://git-scm.com/downloads
```

If Git asks for login, use GitHub browser authentication or a GitHub personal access token.

Before pushing, check files:

```bash
git status
```

Repository name should be:

```text
azentrix-fullstack-task2
```

## Loom Demo Video

Use this quick recording flow:

1. Open the deployed app.
2. Show login with `user` / `User@123`.
3. Show registration by creating a new member.
4. Log in as admin.
5. Show Admin Users: add, edit role, delete user.
6. Create a new board and open it.
7. Create a card with assignee, due date, and priority.
8. Drag the card across To Do, In Progress, and Done.
9. Open a second browser logged in as user and show the realtime update.
10. Show that user cannot edit/delete an admin-owned card unless assigned.
11. End by showing the README with live link and credentials.

Paste the Loom link in the Live Demo section before submission.

## Screenshots

Demo views included in this repository:

![Login demo](screenshots/login-demo.svg)

![Board and admin demo](screenshots/board-demo.svg)

## Project Structure

```text
.
|-- data/
|   `-- db.json
|-- public/
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- screenshots/
|   |-- board-demo.svg
|   `-- login-demo.svg
|-- .env.example
|-- .gitignore
|-- package.json
|-- README.md
`-- server.js
```
