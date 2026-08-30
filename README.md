# 🚀 ProjectHub (MERN-PM) — Next-Gen Project Management System

**ProjectHub** is an enterprise-grade, full-stack project management and collaboration web application. Built with **React 19**, **Tailwind CSS 4**, **Node.js/Express**, and **Supabase (PostgreSQL, Row Level Security, Storage, & Real-Time sync)**, ProjectHub empowers teams to plan, organize, track, and deliver complex milestones with precision.

---

## 🌟 Enterprise Features & Capabilities

### 1. 🎯 Advanced Task Management & Multi-View Engine
- **4 Interactive Workspace Views**:
  - 📊 **Kanban Board**: Drag-and-drop workflow columns (`Todo`, `In Progress`, `In Review`, `Done`).
  - 📝 **List View**: Rapid status toggle table with instant sorting & filters.
  - 📅 **Calendar View**: Monthly grid mapping deadlines with priority color pills.
  - ⏱️ **Gantt Chart & Critical Path**: Visual timeline bars, milestone progress, and dependency paths.
- **Nested Subtasks & Milestones**: Track itemized deliverables with progress bars.
- **Task Recurrence**: Schedule daily, weekly, and monthly repeating tasks.

### 2. ⚡ Real-Time Collaboration & Audio Huddles
- **Live Team Chat Room**: Persistent real-time project chat with instant Supabase message broadcasting.
- **Integrated Audio Huddles**: 1-click voice rooms with live mute/unmute, speaking wave pulses, and participant avatar rings.
- **Task Discussions**: In-task comment threads with user timestamps.

### 3. ⏱️ Time Tracking & Resource Capacity Heatmap
- **Live Stopwatch**: In-card live timer to track work sessions with 1-click logging.
- **Workload Capacity Heatmap**: Team utilization meters (40h/week baseline) with overload burnout alerts (&gt;100%) and optimal capacity indicators.

### 4. 🤖 Automated Workflows (Trigger-Action Engine)
- **Custom Automation Rules**:
  - *Trigger*: When task status changes, all subtasks completed, high-priority created, or GitHub PR merged.
  - *Action*: Auto-move column status, auto-assign lead, or send team broadcast notifications.
- **Execution Tracking**: Live execution counter and rule toggle switches.

### 5. 📈 Advanced Analytics & Sprint Burndown
- **Sprint Burndown Curve**: Compare planned ideal velocity against actual burndown in real time.
- **Status & Priority Distribution Gauges**: Multi-dimensional sprint KPIs.
- **Export & Print**: Printable PDF executive reports and downloadable CSV spreadsheets.

### 6. 🌐 Client Portals & Granular Role Permissions (RBAC)
- **Public Shareable Portals**: Instant read-only showcase links (`/share/:token`) for clients and external stakeholders without login.
- **Role Hierarchy**: `Owner`, `Admin`, `Member`, and `Viewer` security enforcement with Supabase RLS.

### 7. 🔌 Developer Integrations & Webhook Hub
- **GitHub / GitLab Webhook Receiver**: Automatically advance tasks to `In Review` or `Done` when Pull Requests are merged.
- **Slack, Jira & Zapier**: Webhook dispatchers for channel alerts and external sync.

### 8. 🧠 Antigravity AI Assistant Engine (v2.0)
- **Natural Language Command Bar**: Type conversational prompts (e.g., *"Create high priority task for API performance benchmark"*) to execute actions instantly.
- **AI Task Breakdown**: 1-click AI generation of 5 milestone checklist items from any task title.
- **AI Project Risk & Bottleneck Assessment**: Real-time project health scoring (0-100), critical path vulnerability detection, and smart mitigation advice.

---

## 🛠️ Technology Stack

- **Frontend**: React 19 (Vite), Tailwind CSS 4, Lucide React, Axios, React Router Dom 7, React Datepicker.
- **Backend**: Node.js, Express.js, JWT Authentication, Multer (Memory Storage).
- **Database & Storage**: Supabase (PostgreSQL, Supabase Auth, Storage Buckets, Realtime Engine).

---

## 🗄️ Supabase Database Architecture

The system uses a relational PostgreSQL schema secured with Row Level Security (RLS):

- `profiles`: User identities, job titles, bios, and avatar URLs.
- `projects`: Project entities with category, priority, due date, color theme, and budget.
- `project_members`: Composite project memberships with role-based permissions (`owner`, `admin`, `member`, `viewer`).
- `tasks`: Work items with Kanban statuses, priorities, assignee references, and estimated hours.
- `subtasks`: Checklists associated with tasks with completion booleans.
- `comments`: Real-time conversation threads linked to tasks.
- `attachments`: File metadata linked to Supabase storage objects.
- `activities`: Audit log entries for project timelines.

---

## 🚀 Getting Started

### 1. Database Setup
Execute the complete schema and policies in your Supabase SQL Editor from:
```sql
supabase_setup.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
