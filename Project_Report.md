# Project Report: ProjectHub (Full-Stack Supabase & React PM System)

## 1. Executive Summary
**ProjectHub** is an enterprise-grade project management application designed for high-performing engineering and product teams. It combines the agility of **React 19** and **Tailwind CSS 4** with the reliability and speed of **Supabase (PostgreSQL, Row Level Security, Realtime Pub/Sub, and Storage)** alongside a **Node.js/Express** API layer.

---

## 2. Objectives & Achievements
- **Dual-View Workflow Engine**: Interactive visual Kanban Board (Drag-and-Drop) and List views.
- **Micro-Milestone Tracking**: Task checklists/subtasks with dynamic progress tracking.
- **Enterprise Collaboration**: Role-based access control (`Owner`, `Admin`, `Member`, `Viewer`) and instant autocomplete member invitations.
- **Live Audit Trail**: Chronological activity logging for all project events and state changes.
- **Real-Time Synchronization**: Live updates powered by Supabase Realtime subscriptions without manual page refreshes.
- **Decentralized Storage**: Secure file uploading and asset distribution via Supabase Storage buckets.

---

## 3. Technology Stack

### Frontend Layer
- **React 19 (Vite):** Modern reactive UI framework with high-speed rendering.
- **Tailwind CSS 4:** Design tokens, dark mode palette, and modern glassmorphism styling.
- **Lucide-React:** Vector icons for intuitive user experiences.
- **React Datepicker & Axios:** Asynchronous HTTP client and calendar date pickers.
- **React Router Dom v7:** Fast client-side routing and protected routes.

### Backend & Database Layer
- **Node.js & Express.js:** RESTful API controllers, middleware, and request validation.
- **Supabase PostgreSQL:** Relational database with Row Level Security (RLS) policies.
- **Supabase Storage:** S3-compatible cloud object store for project attachments and avatars.
- **Supabase Realtime:** Postgres Change Data Capture (CDC) over WebSockets.
- **JWT & Bcrypt:** Secure authentication and token handling.

---

## 4. Database Schema (Supabase PostgreSQL)

1. **`profiles` Table**:
   - `id`: UUID (Primary Key, foreign key to `auth.users`)
   - `name`: TEXT
   - `email`: TEXT (Unique)
   - `avatar_url`: TEXT
   - `bio`: TEXT
   - `job_title`: TEXT
   - `phone`: TEXT
   - `created_at` / `updated_at`: TIMESTAMPTZ

2. **`projects` Table**:
   - `id`: UUID (Primary Key)
   - `title`: TEXT
   - `description`: TEXT
   - `status`: TEXT ('Active', 'On Hold', 'Completed', 'Archived')
   - `category`: TEXT
   - `priority`: TEXT ('Low', 'Medium', 'High')
   - `due_date`: DATE
   - `color`: TEXT
   - `budget`: NUMERIC
   - `tags`: TEXT
   - `owner_id`: UUID (FK to `profiles`)

3. **`project_members` Table**:
   - `project_id`: UUID (FK to `projects`)
   - `user_id`: UUID (FK to `profiles`)
   - `role`: TEXT ('owner', 'admin', 'member', 'viewer')
   - `joined_at`: TIMESTAMPTZ

4. **`tasks` Table**:
   - `id`: UUID (Primary Key)
   - `project_id`: UUID (FK to `projects`)
   - `title`: TEXT
   - `description`: TEXT
   - `status`: TEXT ('Todo', 'In Progress', 'In Review', 'Done')
   - `priority`: TEXT ('Low', 'Medium', 'High')
   - `due_date`: DATE
   - `assigned_to`: UUID (FK to `profiles`)
   - `tags`: TEXT
   - `order_index`: INTEGER
   - `estimated_hours`: NUMERIC

5. **`subtasks` Table**:
   - `id`: UUID (Primary Key)
   - `task_id`: UUID (FK to `tasks`)
   - `title`: TEXT
   - `is_completed`: BOOLEAN

6. **`comments` Table**:
   - `id`: UUID (Primary Key)
   - `task_id`: UUID (FK to `tasks`)
   - `user_id`: UUID (FK to `profiles`)
   - `content`: TEXT

7. **`attachments` Table**:
   - `id`: UUID (Primary Key)
   - `project_id`: UUID (FK to `projects`)
   - `user_id`: UUID (FK to `profiles`)
   - `file_name`: TEXT
   - `file_url`: TEXT
   - `file_size`: INTEGER

8. **`activities` Table (Audit Log)**:
   - `id`: UUID (Primary Key)
   - `project_id`: UUID (FK to `projects`)
   - `user_id`: UUID (FK to `profiles`)
   - `action`: TEXT
   - `details`: JSONB

---

## 5. API Endpoints

### Auth & User Profile
- `POST /api/auth/register` — Create user account in Supabase Auth and Profiles table.
- `POST /api/auth/login` — Sign in and issue JWT.
- `GET /api/auth/me` — Return current authenticated profile.
- `PUT /api/auth/profile` — Update user profile details.
- `POST /api/auth/avatar` — Upload avatar to Supabase Storage.
- `GET /api/auth/users` — Search registered users for member invites.

### Projects & Management
- `GET /api/projects` — Fetch all projects for authenticated user.
- `POST /api/projects` — Create a project and assign owner membership.
- `GET /api/projects/:id` — Get project details, members, tasks, and subtasks.
- `PUT /api/projects/:id` — Update project metadata.
- `DELETE /api/projects/:id` — Delete project.
- `GET /api/projects/:id/export` — Export project brief and tasks as structured JSON.

### Collaborators & Members
- `POST /api/projects/:id/members` — Add collaborator with specified role.
- `PUT /api/projects/:id/members/:userId` — Update collaborator role.
- `DELETE /api/projects/:id/members/:userId` — Remove collaborator or leave project.

### Tasks & Subtasks
- `POST /api/projects/:id/tasks` — Create task with assignee, priority, and due date.
- `PUT /api/projects/:id/tasks/:taskId` — Update task status or details.
- `DELETE /api/projects/:id/tasks/:taskId` — Remove task.
- `GET /api/projects/:id/tasks/:taskId/subtasks` — List task checklists.
- `POST /api/projects/:id/tasks/:taskId/subtasks` — Add checklist item.
- `PUT /api/projects/:id/tasks/:taskId/subtasks/:subtaskId` — Toggle checklist completion.
- `DELETE /api/projects/:id/tasks/:taskId/subtasks/:subtaskId` — Delete checklist item.

### Attachments & Activities
- `POST /api/projects/upload` — Upload binary asset to Supabase Storage bucket.
- `GET /api/projects/:id/attachments` — Fetch project attachments.
- `POST /api/projects/:id/attachments` — Save attachment record.
- `DELETE /api/projects/:id/attachments/:attachmentId` — Delete file from Storage & DB.
- `GET /api/projects/:id/activities` — Fetch real-time audit log stream.

---

## 6. Conclusion
The enhanced **ProjectHub** architecture sets a benchmark for modern full-stack web applications, combining PostgreSQL relational integrity, Supabase Row-Level Security, real-time collaboration, and a responsive frontend interface.
