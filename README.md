# Nexus Task Management: Mission Control

Nexus is a high-performance, aesthetically-driven project management application designed for teams that demand precision, speed, and a "Mission Control" level of overview. Built with React, Tailwind CSS, and Firebase, it provides a real-time collaborative workspace with a unique tactical interface.

## Key Features

- **Strategic Dashboard (Mission Control):** A bento-grid layout providing immediate visibility into global task progress, overdue deliverables, and live activity streams.
- **Operational Boards:** Visualize project workflows with specialized status columns (Initial, Active, Resolved) and high-intensity priority indicators.
- **Protocol Management (Subtasks):** Break down complex objectives into granular protocol directives with progress tracking.
- **Intelligence Feed:** Integrated comment threads for team communication and a comprehensive operational timeline (History) for every task.
- **Data-Driven Insights:** Built-in analytics view featuring lifecycle distribution and threat-level (priority) matrices.
- **Real-time Sync:** Powered by Firebase, ensuring all team members are synchronized across the operational environment instantly.

## Tech Stack

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS (Modern "Neo-Brutalist" design)
- **Animations:** Motion (framer-motion)
- **Icons:** Lucide React
- **Charts:** Recharts
- **Backend:** Firebase (Firestore & Authentication)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd nexus-task-manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Create a `.env` file in the root directory and add your Firebase configuration (see `.env.example` for required keys).

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## Operational Overview

### Dashboard
The Dashboard serves as your central nervous system. It displays critical metrics, active deployment activity, and quick access to your most urgent tasks.

### Projects
Create and manage multiple projects. Invite operatives via email to collaborate on specific workspaces.

### Tasks
Tasks are the core unit of operation. Each task supports descriptions, priority levels, assignments, subtask protocols, and intelligence comments.

## Security

Nexus uses Firebase Security Rules to ensure that data access is restricted to authorized project members only. Each project workspace is isolated, ensuring that operatives only see the intelligence relevant to them.
