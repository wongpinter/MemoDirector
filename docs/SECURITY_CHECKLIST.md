# Security Checklist

## ✅ Environment Variables

### What's Protected:
- ✅ `.env` is in `.gitignore` - **Your actual API keys are safe**
- ✅ `.env.example` only contains placeholders - **Safe to commit**
- ✅ `.firebase/` directory is excluded - **Firebase cache is safe**

### Verify Protection:
```bash
# This should NOT show .env
git status

# This should show .env is ignored
git check-ignore .env
```

### If .env Was Accidentally Committed:
```bash
# Remove from Git history (but keep local file)
git rm --cached .env

# Commit the removal
git commit -m "Remove .env from Git"

# Push to remote
git push origin main

# IMPORTANT: Rotate your API keys immediately!
# - Get new Gemini API key: https://aistudio.google.com/apikey
# - Regenerate Firebase keys in Firebase Console
```

## 🔑 API Key Security

### Client-Side API Keys (Current Setup)
Your Firebase API keys are visible in the client-side code. **This is normal and expected** for Firebase web apps.

**Why it's safe:**
- Firebase API keys are not secret
- They're restricted by Firebase Security Rules
- They're restricted by domain in Firebase Console

**What you should do:**
1. ✅ Set up Firebase Security Rules (see below)
2. ✅ Enable Firebase App Check (recommended)
3. ✅ Restrict API keys to your domain in Firebase Console

### Gemini API Key
Your Gemini API key is also in client-side code. **This has some risks:**

**Risks:**
- Anyone can extract it from your deployed app
- They could use your quota
- Could cost you money if you have billing enabled

**Mitigation options:**

#### Option 1: API Key Restrictions (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your Gemini API key
3. Add **HTTP referrer restrictions**:
   - `https://memodirector.web.app/*`
   - `http://localhost:3000/*` (for development)

#### Option 2: Backend Proxy (Most Secure)
Create a backend API that:
- Stores the Gemini API key server-side
- Proxies requests from your frontend
- Implements rate limiting
- Requires authentication

## 🔒 Firebase Security Rules

### Current Status: ⚠️ Needs Configuration

Your Firestore database likely has test mode rules that allow anyone to read/write. **This is insecure for production!**

### Recommended Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // PAO data - allow read/write for authenticated users only
    match /pao/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Or if you want public read but authenticated write:
    match /pao/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### How to Update Rules:
1. Go to [Firebase Console](https://console.firebase.google.com/project/memodirector/firestore/rules)
2. Update the rules
3. Click **Publish**

## 🛡️ Additional Security Measures

### 1. Enable Firebase App Check
Protects your backend resources from abuse.

```bash
# Install App Check
npm install firebase/app-check

# Add to your app initialization
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```

### 2. Set Up CORS
If you add a backend API, configure CORS properly:
- Only allow your domain
- Don't use `*` in production

### 3. Content Security Policy
Add CSP headers to prevent XSS attacks:

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;">
```

### 4. Rate Limiting
Implement rate limiting for API calls to prevent abuse.

### 5. Input Validation
- ✅ Already implemented in `utils/validation.ts`
- Sanitizes user input before sending to AI
- Prevents prompt injection attacks

## 📋 Pre-Deployment Checklist

Before deploying to production:

- [ ] `.env` is in `.gitignore`
- [ ] No API keys in Git history
- [ ] Firebase Security Rules configured
- [ ] API keys restricted by domain
- [ ] Firebase App Check enabled (optional but recommended)
- [ ] HTTPS enabled (automatic with Firebase Hosting)
- [ ] CSP headers configured (optional)
- [ ] Rate limiting implemented (optional)

## 🚨 If API Keys Are Compromised

1. **Immediately rotate all keys:**
   - Gemini API: Generate new key at https://aistudio.google.com/apikey
   - Firebase: Regenerate in Firebase Console

2. **Check usage:**
   - Google Cloud Console for Gemini usage
   - Firebase Console for Firebase usage

3. **Review logs:**
   - Look for suspicious activity
   - Check for unusual patterns

4. **Update restrictions:**
   - Add domain restrictions
   - Enable App Check
   - Implement rate limiting

## 📚 Resources

- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Google Cloud API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)

---

**Remember:** Security is an ongoing process, not a one-time setup!
