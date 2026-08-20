# Sentinel

Sentinel is a real-time IoT Healthcare Monitoring Platform. It provides telemetry tracking and alert management for patients, complete with a robust Node.js backend and a modern React dashboard.

## 🏗️ Architecture

The system is organized as a monorepo containing two main modules:
- **`backend/`**: Built with Node.js, Express, Socket.IO, and PostgreSQL (Prisma). It handles telemetry ingestion, threshold evaluation, and broadcasts real-time alerts.
- **`frontend/`**: Built with React 19 and Vite. Features a comprehensive, responsive dashboard for medical professionals to monitor live patient vitals, manage hardware devices, and resolve critical alerts.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/spryzen-devs/sentinel.git
   cd sentinel
   ```

2. **Start the Backend**
   ```bash
   cd backend
   npm install
   # Configure your .env file with your DATABASE_URL
   npm run dev
   ```

3. **Start the Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   The dashboard will be available at `http://localhost:5173`.

## ✨ Core Features
- **Real-Time Live Monitor**: View patient vitals (Heart Rate, SpO2) streaming instantly via WebSockets.
- **Alert Management**: Automatic triggers for abnormal vitals (e.g., low SpO2) with a complete resolution workflow.
- **Device Management**: Register and track the online/offline status of IoT medical sensors.
- **Secure Authentication**: JWT-based session management for administrators and doctors.
