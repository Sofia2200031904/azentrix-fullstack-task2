# TaskFlow Demo Video Script

Use this script for a 3-5 minute Loom, Zoom, or screen recorder demo.

## Before Recording

Run the project:

```powershell
cd "C:\Users\Challa_Smile _Sofia\Downloads\Task 2\Task 2"
node server.js
```

Open:

```text
http://localhost:3000
```

Demo login:

```text
Admin: admin / Admin@123
Member: user / User@123
```

## Video Flow

### 1. Introduction

Say:

```text
Hello, this is my TaskFlow project. It is a full-stack task management web app for teams. The frontend is built with HTML, CSS, and JavaScript, and the backend is built with Node.js. It supports login, registration, multiple project boards, draggable task cards, admin user management, and real-time updates.
```

Show the login page.

### 2. Login

Say:

```text
I will first log in as the admin user.
```

Login with:

```text
admin
Admin@123
```

### 3. Dashboard And Projects

Say:

```text
After login, we can see the workspace dashboard. On the left side, there are multiple project boards. I added 9 project boards, including Website Redesign, Marketing Team, Mobile App, Product Roadmap, Customer Support, Sales Pipeline, Content Calendar, QA Testing, and DevOps Automation.
```

Click through 2 or 3 project boards.

### 4. Create A Task

Say:

```text
Now I will create a new task. Each task has a title, description, assignee, due date, and priority.
```

Create a sample task:

```text
Title: Final demo testing
Description: Verify the app before submission
Assignee: Admin
Priority: High
```

### 5. Drag And Drop

Say:

```text
The app supports drag and drop. I can move a task from To Do to In Progress and then to Done.
```

Drag the task between columns.

Important note:

```text
Admin can drag all cards. Members can only drag cards assigned to them or created by them.
```

### 6. Search And Filter

Say:

```text
There is also search and priority filtering, so users can quickly find tasks.
```

Search for a task and use the priority filter.

### 7. Admin User Management

Say:

```text
The admin user can manage users. Admin can add users, edit user roles, and delete users.
```

Show the Admin Users section.

### 8. Registration

Say:

```text
New users can also register from the registration form. Registered users are members by default.
```

Log out and briefly show the registration panel.

### 9. Backend And Storage

Say:

```text
The backend provides API routes for login, boards, cards, users, and card movement. The project stores data in a local JSON database file, data/db.json, so boards, users, cards, and activity are saved.
```

Open the project folder or README if you want to show the files.

### 10. Closing

Say:

```text
This completes my TaskFlow full-stack project demo. The project includes frontend, backend, authentication, role-based permissions, multiple boards, drag-and-drop cards, real-time updates, and deployment instructions.
```

## Submission Checklist

- GitHub repository link
- Live deployed website link
- Demo video link
- README with credentials and setup instructions
