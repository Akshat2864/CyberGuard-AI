# 🚀 Quick Start - CyberGuardAI

## One Command to Run Everything

```bash
./start.sh
```

That's it! The script will:
- ✅ Install Python dependencies
- ✅ Install Node.js (if needed)
- ✅ Install frontend packages
- ✅ Start Flask backend (port 8000)
- ✅ Start React frontend (port 5173)

## Alternative: Manual Commands

If you prefer running commands separately:

```bash
# Terminal 1 - Backend
python3 app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Access the App

Open your browser:
```
http://localhost:5173
```

## Test the Application

Enter URLs to analyze:
- `https://google.com` - Safe
- `https://paypal-verify-login.com` - Phishing detection
- `https://evil-g00gle-login.xyz` - Typosquatting detection
