# Laser-Shooter

## Overview
Laser-Shooter is a web-based multiplayer shooting game project built with a Python backend and a React frontend.  
It provides a responsive game interface along with a structured API for handling requests and real-time interactions.

Developed by:
- **Phiwo**  
- **Galane**

---  

## Features

- Real-time gameplay with a modern web interface
- REST API powered by **FastAPI**
- Modular architecture with separate frontend and backend
- WebSocket support for bi-directional, real-time communication

---

## Tech Stack

### Backend
- **Python**
- **FastAPI**
- **WebSockets**

### Frontend
- **Node.js** with **npm**
- **React Typescript+Vite** - Frontend build and development tool
- **Tailwind CSS**

---

## Getting Started

### Prerequisites
- **Python**
- **Node.js**
- **npm**
- Web browser

### Clone the repository
`https://github.com/Shisui-Pho/Laser-Shooter.git`

### Running the API 
- On your terminal locate the folder `Laser-Shooter/back-end/`
- Run `pip install -r requirements.txt` (best to do it on a virtual python environment)
- Run `uvicorn main:app --reload` to start the server
- Open browser and go to `http://127.0.0.1:8000/docs` to see the api end-points documentation

### Running the Web App
- On your terminal locate the folder `Laser-Shooter/front-end/`
- Run `npm install` to install dependencies
- Run `npm run dev` to start the development server
- Open the app via local link
