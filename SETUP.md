# CyberGuard AI - Setup & Running Guide

## Project Structure
- **Backend**: Flask Python API (runs on port 5000)
- **Frontend**: React + Vite (runs on port 5173)
- **Database**: Supabase (cloud-based)

## Prerequisites
- Python 3.8+
- Node.js 18+
- npm

## Step 1: Setup Backend (Flask)

### 1.1 Create Python Virtual Environment
```bash
cd /Users/rohan_rajak/Desktop/CyberGuardAI
python3 -m venv venv
source venv/bin/activate
```

### 1.2 Install Dependencies
```bash
pip install -r requirements.txt
```

### 1.3 Prepare Environment Variables
```bash
cp .env.example .env
# Edit .env if you need custom Supabase credentials
```

### 1.4 Run Flask Backend
```bash
python app.py
```
The backend will start on `http://localhost:5000`

## Step 2: Setup Frontend (React)

### 2.1 Install Dependencies
Open a new terminal and navigate to frontend folder:
```bash
cd frontend
npm install
```

### 2.2 Run Development Server
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`

## Step 3: Access the Application

1. Open your browser and go to `http://localhost:5173`
2. Explore the home page or navigate to Dashboard
3. Enter a URL to analyze
4. The frontend will communicate with the Flask backend on `http://localhost:5000`

## API Endpoints

- **POST** `/analyze` - Analyze a URL
  - Request: `{ "url": "https://example.com" }`
  - Response: `{ "url": "...", "result": "Safe|Suspicious|Malicious", "confidence": 98.5, ... }`

- **GET** `/analytics` - Get scan statistics
  - Response: `{ "total_scans": 100, "safe_count": 80, "suspicious_count": 15, "malicious_count": 5 }`

- **GET** `/history` - Get scan history
  - Response: Array of scan records

## Machine Learning Model

The Flask backend uses a trained ML model (`model.pkl`) for additional threat detection.
To train a new model, run:
```bash
python train_model.py
```

## Troubleshooting

### Frontend can't reach backend
- Ensure Flask server is running on localhost:5000
- Check browser console for CORS errors
- Verify no firewall is blocking port 5000

### Model not found error
- Run `train_model.py` to generate `model.pkl`
- Or download pre-trained model if available

### Database connection issues
- Verify Supabase credentials in `.env`
- Check internet connection
