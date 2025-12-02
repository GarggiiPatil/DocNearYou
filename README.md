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

###Snapshots
<img width="760" height="435" alt="home_page" src="https://github.com/user-attachments/assets/8b86eba3-3eed-482a-9679-1d380b4c5ec5" />
<img width="751" height="687" alt="doctor_login" src="https://github.com/user-attachments/assets/43e9b03b-f7d5-4dac-a86f-e55870e3128c" />
<img width="744" height="364" alt="doctor_dashboard" src="https://github.com/user-attachments/assets/b05f0999-ea34-432f-9a7c-c68bbfb3e818" />
<img width="521" height="604" alt="patient_dashboard" src="https://github.com/user-attachments/assets/60e9371a-fed1-43e3-907f-840ed451b2dc" />
<img width="748" height="355" alt="patient_book_appointment" src="https://github.com/user-attachments/assets/bad2b45b-29a3-414a-968b-d850a5c8fcfc" />
<img width="747" height="547" alt="nearby_doctors" src="https://github.com/user-attachments/assets/c32dc394-94c3-4cda-8bb1-71c71af27367" />

