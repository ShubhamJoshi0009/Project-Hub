# Project Report: MERN-PM (Project Management System)

## 1. Introduction
**MERN-PM** is a comprehensive, full-stack project management web application built using the MERN (MongoDB, Express, React, Node.js) stack. The application provides a centralized platform for individuals and teams to organize projects, track tasks, and collaborate effectively. It features a modern, responsive user interface with secure authentication and real-time project updates.

---

## 2. Objectives
- To provide a secure and scalable platform for project management.
- To enable task tracking with statuses and priorities.
- To facilitate team collaboration through member management.
- To offer an intuitive dashboard for a quick overview of project progress.

---

## 3. Technology Stack

### Frontend
- **React (Vite):** Fast, modern library for building dynamic user interfaces.
- **Tailwind CSS 4:** Utility-first CSS framework for rapid and modern styling.
- **Lucide-React:** For high-quality, lightweight icons.
- **Axios:** For handling asynchronous API requests.
- **React Router Dom:** For seamless client-side routing.

### Backend
- **Node.js & Express.js:** Scalable runtime and framework for the API layer.
- **MongoDB & Mongoose:** NoSQL database for flexible data storage and modeling.
- **JWT (JSON Web Tokens):** For secure, stateless authentication.
- **Bcryptjs:** For industry-standard password hashing.

---

## 4. Key Features

### A. Authentication & User Management
- Secure user registration and login with encrypted passwords.
- Persistent sessions using JWT stored in local storage.
- User profile management.

### B. Project Management
- Create, View, Edit, and Delete projects.
- Categorize projects (e.g., General, Development, Design).
- Track project status (Active, On Hold, Completed).

### C. Task Management
- Create tasks within specific projects.
- Set task priorities (Low, Medium, High).
- Update task status (Todo, In Progress, Completed).

### D. Collaboration
- Invite team members to projects via email.
- Role-based access (Owner vs. Member).

### E. Dashboard & UI
- Responsive Sidebar navigation.
- Dashboard with project counts and recent activity.
- Support for Dark/Light theme transitions.

---

## 5. System Architecture
The application follows a standard **Client-Server** architecture:
1.  **Client:** The React frontend manages the state and UI, communicating with the backend via RESTful APIs.
2.  **Server:** The Express backend handles routing, business logic, and authentication middleware.
3.  **Database:** MongoDB stores users, projects, and task data as JSON-like documents.

---

## 6. Database Schema

### User Model
- `name`: String (Required)
- `email`: String (Unique, Required)
- `password`: String (Hashed)

### Project Model
- `title`: String (Required)
- `description`: String
- `status`: String (Active, On Hold, Completed)
- `category`: String
- `owner`: Reference to User Model (ObjectId)
- `members`: Array of User References (ObjectIds)
- `tasks`: Array of Task Objects (Embedded)

### Task Object (Embedded in Project)
- `id`: Unique String (UUID)
- `title`: String
- `status`: String
- `priority`: String

---

## 7. API Endpoints

### Auth Routes
- `POST /api/auth/register`: Register new user.
- `POST /api/auth/login`: Authenticate user and return token.
- `GET /api/auth/me`: Get current user details.

### Project Routes
- `GET /api/projects`: Get all projects for logged-in user.
- `POST /api/projects`: Create a new project.
- `GET /api/projects/:id`: Get project details by ID.
- `PUT /api/projects/:id`: Update project details.
- `DELETE /api/projects/:id`: Delete a project.
- `POST /api/projects/:id/members`: Add a member by email.

---

## 8. Conclusion
**MERN-PM** demonstrates the power of the MERN stack in building production-ready productivity tools. By combining a robust backend with a sleek, performant frontend, it provides a seamless experience for managing complex workflows and team collaboration.
