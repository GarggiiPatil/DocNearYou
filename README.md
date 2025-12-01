# DocNearYou – An AI-Powered Healthcare Assistant

DocNearYou is a smart healthcare web application designed to simplify doctor–patient interaction using AI-driven features.  
It includes secure authentication, appointment management, a TF-IDF–based medical chatbot, and nearest hospital search using clustering algorithms.


## 🌟 Features

### 👨‍⚕️ Doctor Module
- Doctor Registration & Login  
- **Face Authentication System** for secure login  
- View pending appointment requests  
- Approve, reject, or reschedule appointments  
- Publish health-related blogs for patients  
- Manage patient bookings and availability  


### 🧑‍🦰 Patient Module
- Patient Registration & Login  
- Book appointments with available doctors  
- View **appointment status** (Approved / Rejected / Pending)  
- Read doctor-posted health blogs  
- Search nearest hospitals using **K-Means Clustering**  
- Chat with AI-based TF-IDF medical assistant  
- View personal profile & appointment history  

### 🤖 AI Chatbot (TF-IDF Based)
- Answers basic medical queries  
- Provides recommendations and remedies  
- Built using **TF-IDF + Cosine Similarity**  
- Works offline and efficiently  

### 🔐 Backend & Security
- Flask Backend with REST APIs  
- JWT Authentication  
- MongoDB Database  
- Middleware-based route protection  
- Optional **blockchain-inspired logging** for secure appointment audit trails  

## 🏗 Tech Stack

### Frontend
- React.js  
- Context API / Hooks  
- Axios for API calls  
- CSS / Tailwind CSS  

### Backend
- Python (Flask)  
- MongoDB  
- REST API Architecture  

### Algorithms Used
- **TF-IDF + Cosine Similarity** → Chatbot  
- **K-Means Clustering** → Nearest hospital search  
- **Face Recognition** → Doctor authentication  


---

## 🚀 How to Run the Project

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py

cd frontend
npm install
npm start

