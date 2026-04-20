# 🚀 CyberGuard AI - Production To-Do List

This is your final checklist for manual settings you (or your team) need to configure inside the **Supabase Dashboard** once you receive the login credentials, as well as the final deployment steps.

---

## 🔐 1. Supabase Authentication Settings
Because you chose to bypass email confirmations (Option 2), here are the exact settings to finalize in your Supabase Auth dashboard:

- [ ] **Disable Email Confirmations:** 
  *Navigate to: Authentication > Providers > Email.*
  *Toggle `Confirm email` to OFF.* This allows users to log in instantly without checking their inbox.
  
- [ ] **Increase Email Rate Limit (Optional but Recommended):** 
  *Navigate to: Authentication > Rate Limits.*
  Since you hit the `email rate limit exceeded` error, increasing this will allow significantly more "Forgot Password" or "Sign Up" tests without triggering the spam blocker cooldown.

- [ ] **Set Site URL for Password Reset Redirects:**
  *Navigate to: Authentication > URL Configuration.*
  *Update `Site URL`* from `http://localhost:3000` to your actual Vercel Domain (e.g., `https://cyberguard.vercel.app`).
  If you don't do this, when users click the "Reset Password" link in their email, it will crash trying to open localhost.

---

## ☁️ 2. Deployment Finalization

- [ ] **Deploy Backend to Railway:**
  1. Link your GitHub repository.
  2. Add your environment variables: `SUPABASE_URL`, `SUPABASE_KEY`.
  3. Set `FRONTEND_URL` to your future Vercel domain.

- [ ] **Deploy Frontend to Vercel:**
  1. Add new project from GitHub.
  2. Set the "Root Directory" to `frontend`.
  3. Under Environment Variables, add `VITE_API_URL` and paste your deployed Railway URL (e.g., `https://cyberguard-api.railway.app`).

---

## 📈 3. Post-Launch Marketing
- [ ] Claim your domain on Google Search Console.
- [ ] Check your Vercel Analytics dashboard to watch live user traffic!
