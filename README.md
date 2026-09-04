# DevTrack 🚀

A production-grade, full-stack project management and tracking application designed with robust architecture, real-time collaboration, secure authentication, and cloud-native deployment.

---

## 🌟 Core Architecture & Pillars

DevTrack is built on a modular 22-pillar architecture, covering everything from database schemas to cloud infrastructure:

1. **Database Schemas (Mongoose Models):** Users, Projects, Tasks, and Activity Logs schemas.
2. **File Attachments & Cloud Storage:** Cloudinary / AWS S3 multimedia support.
3. **Automated Email Notifications:** NodeMailer / SendGrid email alerts.
4. **Drag-and-Drop Kanban Board:** Interactive smooth workflow (`@hello-pangea/dnd` / Native DnD).
5. **Authentication & RBAC:** Multi-role access (Admin, PM, Dev, Tester), Bcrypt, and JWT sessions.
6. **Project & Sprint Management:** Asana-style project planning and team assignment.
7. **Task, Issue & Bug Tracking:** Jira-style custom statuses, priorities, and task types.
8. **Real-Time Collaboration:** Socket.io live updates and top-bar notification bell.
9. **Markdown Editor & Rich Text Support:** `ReactQuill` / `@uiw/react-md-editor` formatting.
10. **Activity Timeline & Audit Log:** GitHub-style audit history log for tracking actions.
11. **AI-Powered Bug Summary & Subtask Generator:** OpenAI / Gemini API integration.
12. **Global Search & Advanced Filtering Engine:** Elasticsearch-style fast multi-attribute search.
13. **Session Management & Security Hardening:** Express-rate-limit, Helmet, and Data Sanitization.
14. **Automated Unit & Integration Testing:** Jest and Supertest test suites.
15. **Dockerization & Containerization:** Docker Engine and Docker-Compose environment setup.
16. **Cloud Infrastructure & Deployment (AWS EC2):** Replaced traditional PaaS with robust **AWS EC2 (Ubuntu)** cloud hosting and 24/7 containerized execution.
17. **Global Error Boundary & Toast Notifications:** React Error Boundary and `react-hot-toast` alerts.
18. **API Pagination, Sorting, & Lazy Loading:** Infinite scroll and backend pagination logic.
19. **Password Reset & Forgot Password Flow:** Token-based email recovery system.
20. **Client-Side Protected Routes & Persistent Sessions:** Auth Guards and persistent JWT state.
21. **Environment Validation:** Joi / Envalid for `.env` config safety on startup.
22. **Centralized Express Error-Handling Middleware:** Global error handler for clean JSON responses.

---

## 🛠️ Tech Stack
* **Frontend / UI:** React, Tailwind CSS, Drag-and-Drop libraries
* **Backend:** Node.js, Express.js, Socket.io
* **Database:** MongoDB (Mongoose)
* **DevOps & Cloud:** Docker, Docker Compose, AWS EC2 (Ubuntu)
* **Security & Testing:** JWT, Bcrypt, Helmet, Jest, Supertest

---

## 🌐 Live Demo & Access
* **Live Production Application:** [Access DevTrack Live](http://16.171.172.227:3000)
## ⚙️ Local Installation & Setup

If you want to run this project locally using Docker, follow these steps:

### Step 1: Clone the repository
```bash
git clone https://github.com/Nishant226/DevTrack.git
cd DevTrack
