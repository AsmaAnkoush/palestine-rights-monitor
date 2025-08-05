# 🛡️ Human Rights Monitor – MIS
This is a university project for the **COMP4382** course.  
It is a full-stack system to report, manage, and track human rights violations.

## Project Structure
- backend/: FastAPI backend with MongoDB database  
- frontend/: React frontend for the user interface  
- README.md: This file

## How to Run the Project

### ▶️ Run the Backend

cd backend  
python -m venv venv  
.\venv\Scripts\activate  
pip install -r requirements.txt  
uvicorn main:app --reload --port 8006

### ▶️ Run the Frontend

cd frontend  
npm install  
npm start

The React app will run at http://localhost:3000.
It connects to the backend at http://localhost:8006.

## Team Members & Main Features

- Moath Moudi – Case Management (Task 1 )  
- Ahmad Ewidat – Incident Reporting ( Task 2 ) 
- Asmaa Ankoush – Victim/Witness Database ( Task 3 )

## 📸 Screenshots

### 🏠 Hero / Landing Page
![Hero Page](backend/screenshots/hero.png)

### 🔐 Login Page
![Login Page](backend/screenshots/login.PNG)

### ➕ Add New Case
![Add Case](backend/screenshots/addCase.PNG)

### 🧍 Victim/Witness Database
![Victim Page](backend/screenshots/victims.PNG)

### 📄 Reports List
![Reports Page](backend/screenshots/reports.PNG)


### 🗺️ Interactive Map
![Map Page](backend/screenshots/map.PNG)

### 📊 Dashboard Overview
![Dashboard](backend/screenshots/dashord.PNG)



## 📄 API Documentation
- FastAPI Swagger UI: [http://localhost:8006/docs](http://localhost:8006/docs)

