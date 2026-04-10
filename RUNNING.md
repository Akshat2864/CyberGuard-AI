# 🚀 CyberGuard AI - Running Application

## ✅ Current Status

Both the **Frontend** and **Backend** are now running and connected!

### Running Servers

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Flask Backend API** | http://localhost:8000 | 8000 | ✅ Running |
| **React Frontend (Vite)** | http://localhost:5173 | 5173 | ✅ Running |

---

## 🌐 Access the Application

Open your browser and go to:
```
http://localhost:5173
```

---

## 📋 What to Test

### 1. **Home Page**
- Navigate to the home page at `http://localhost:5173`
- You'll see the CyberGuard AI landing page
- Try entering a URL in the "Quick Analyzer" input box
- Click "Deep Analyze" to test the backend connection
- The response will show the threat classification

### 2. **Dashboard**
- Click "Real-Time Scanner" button or navigate to `/dashboard`
- This shows the full threat analysis interface
- Enter URLs to scan:
  - `https://paypal-verify-login.com` (detects phishing keywords)
  - `https://google.com` (should be classified as safe)
  - `https://evil-g00gle-login.xyz` (detects typosquatting)

### 3. **Scan Results**
The backend returns:
```json
{
  "url": "https://paypal-verify-login.com",
  "result": "Safe|Suspicious|Malicious",
  "confidence": 98.4,
  "risk_score": 2,
  "threat_type": ["Phishing"],
  "reasons": ["Contains phishing-related keywords"],
  "explanations": [
    "The URL contains the keyword 'login', which is commonly used in phishing attacks..."
  ]
}
```

---

## 🔧 Backend API Endpoints

### 1. **POST /analyze**
Analyzes a URL for threats

**Request:**
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Response:**
```json
{
  "url": "https://example.com",
  "result": "Safe",
  "confidence": 99.8,
  "risk_score": 0,
  "threat_type": [],
  "reasons": [],
  "explanations": ["No significant threats were detected."]
}
```

### 2. **GET /analytics**
Returns scan statistics

**URL:** `http://localhost:8000/analytics`

**Response:**
```json
{
  "id": 1,
  "total_scans": 42,
  "safe_count": 35,
  "suspicious_count": 5,
  "malicious_count": 2
}
```

### 3. **GET /history**
Returns last 50 scan records

**URL:** `http://localhost:8000/history`

**Response:**
```json
[
  {
    "id": "uuid",
    "created_at": "2026-04-10T...",
    "url": "https://example.com",
    "result": "Safe",
    "confidence": 99.8,
    "risk_score": 0,
    "threat_type": "None",
    "user_id": "anonymous"
  }
]
```

---

## ⚡ How Data Flows

1. **User enters URL in Frontend** (React on port 5173)
2. **Frontend sends POST request** to `/analyze` endpoint
3. **Backend receives request** (Flask on port 8000)
4. **Backend analyzes URL using:**
   - Heuristic pattern matching (phishing keywords, typosquatting, etc.)
   - Machine Learning model (if model.pkl exists)
5. **Backend returns classification** (Safe/Suspicious/Malicious)
6. **Frontend displays results** with confidence scores and explanations
7. **Data is saved to Supabase** for persistence and analytics

---

## 🔌 How to Stop Servers

### Method 1: Keyboard shortcut
- In Flask terminal: `Ctrl+C`
- In React terminal: `Ctrl+C`

### Method 2: Kill processes by port
```bash
# Kill Flask (port 8000)
lsof -ti:8000 | xargs kill -9

# Kill React (port 5173)
lsof -ti:5173 | xargs kill -9
```

---

## ⚙️ Configuration

### Flask Backend (app.py)
- **Host:** 127.0.0.1
- **Port:** 8000
- **Debug:** Off (production-ready)
- **Reloader:** Disabled
- **CORS:** Enabled for localhost:5173

### React Frontend (.jsx)
- **Port:** 5173 (Vite dev server)
- **API Base URL:** http://localhost:8000
- **Development:** Built with Vite, React 19, React Router 7

---

## 🐛 Troubleshooting

### "Port already in use"
```bash
# Check what's using the port
lsof -i:8000
lsof -i:5173

# Kill the process
kill -9 <PID>
```

### "Cannot connect to backend"
- Verify Flask is running: `curl http://localhost:8000/`
- Check Frontend API URL in App.jsx: `const API_BASE_URL = 'http://localhost:8000'`
- Verify CORS is enabled in app.py

### "Module not found" errors
- Ensure all npm packages are installed: `npm install --legacy-peer-deps`
- Ensure all Python packages are installed: `pip install -r requirements.txt`

---

## 📊 Example Test Cases

Try these URLs to see different threat levels:

| URL | Expected Result | Reason |
|-----|-----------------|--------|
| `https://google.com` | Safe | Legitimate domain |
| `https://paypal-verify-login.com` | Suspicious | Contains phishing keywords |
| `https://evil-g00gle-login.xyz` | Suspicious | Typosquatting (g00gle → google) |
| `https://bank-update-verify.xyz` | Suspicious | Multiple phishing keywords |
| `http://192.168.1.1:8080/secure` | Suspicious | IP address instead of domain |

---

## 🎯 Features Implemented

✅ Frontend-Backend API connection
✅ URL threat analysis endpoint
✅ Heuristic phishing detection
✅ Machine Learning model support
✅ Real-time analytics dashboard
✅ Scan history tracking
✅ Supabase database integration
✅ CORS support
✅ Error handling and validation

---

## 📝 Notes

- The machine learning model (`model.pkl`) is optional - app runs without it
- Supabase credentials are embedded in `app.py` (should use `.env` in production)
- Frontend uses Framer Motion for animations and Recharts for visualizations
- Database persistence requires active Supabase account

---

**Last Updated:** April 10, 2026
**Status:** ✅ Fully Operational
