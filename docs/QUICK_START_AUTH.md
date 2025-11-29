# Quick Start: Enable Authentication (5 Minutes)

## 🚀 Fast Setup

### 1️⃣ Create Firebase Project (2 min)

```
1. Go to: https://console.firebase.google.com/
2. Click: "Add project"
3. Name: "memodirector" (or your choice)
4. Click: "Create project"
```

### 2️⃣ Enable Authentication (1 min)

```
1. Click: "Authentication" (left sidebar)
2. Click: "Get started"
3. Click: "Sign-in method" tab

Enable Email/Password:
   - Click "Email/Password"
   - Toggle ON
   - Click "Save"

Enable Google:
   - Click "Google"
   - Toggle ON
   - Select support email
   - Click "Save"
```

### 3️⃣ Create Firestore Database (1 min)

```
1. Click: "Firestore Database" (left sidebar)
2. Click: "Create database"
3. Select: "Start in production mode"
4. Choose: Location (closest to you)
5. Click: "Enable"
```

### 4️⃣ Get Configuration (1 min)

```
1. Click: ⚙️ (gear icon) → "Project settings"
2. Scroll to: "Your apps"
3. Click: </> (web icon)
4. Register app: "MemoDirector Web"
5. Copy: All config values
```

### 5️⃣ Configure Your App (30 sec)

```bash
# Copy example file
cp .env.example .env

# Edit .env and paste your Firebase config
# Replace these values with yours:
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
```

### 6️⃣ Deploy Security Rules (30 sec)

```bash
# Install Firebase CLI (if needed)
npm install -g firebase-tools

# Login
firebase login

# Deploy rules
firebase deploy --only firestore:rules
```

### 7️⃣ Test It! (30 sec)

```bash
# Check configuration
npm run check-firebase

# Start dev server
npm run dev

# Open browser and try:
# - Click "Sign In"
# - Sign up with email
# - Or use Google Sign-In
```

## ✅ Verification

Run this command to check your setup:
```bash
npm run check-firebase
```

You should see:
```
✅ .env file exists
✅ VITE_FIREBASE_API_KEY: AIzaSy...
✅ VITE_FIREBASE_AUTH_DOMAIN: your-project...
✅ VITE_FIREBASE_PROJECT_ID: your-project-id
✅ VITE_FIREBASE_STORAGE_BUCKET: your-project...
✅ VITE_FIREBASE_MESSAGING_SENDER_ID: 123456...
✅ VITE_FIREBASE_APP_ID: 1:123456...
✅ firestore.rules file exists
🎉 Firebase configuration looks good!
```

## 🐛 Common Issues

### "Cannot register or login"

**Check these:**
1. ✅ `.env` file exists and has correct values
2. ✅ Email/Password enabled in Firebase Console
3. ✅ Google Sign-In enabled in Firebase Console
4. ✅ Firestore database created
5. ✅ Dev server restarted after changing `.env`

**Quick fix:**
```bash
# 1. Check config
npm run check-firebase

# 2. Restart dev server
# Press Ctrl+C to stop
npm run dev
```

### "Firebase: Error (auth/operation-not-allowed)"

**Fix:**
1. Go to Firebase Console
2. Authentication → Sign-in method
3. Enable Email/Password
4. Enable Google

### "Firebase: Error (auth/configuration-not-found)"

**Fix:**
1. Check `.env` file exists
2. Verify all VITE_FIREBASE_* variables are set
3. Restart dev server

### "Permission denied" when saving

**Fix:**
```bash
firebase deploy --only firestore:rules
```

## 📱 Test Checklist

- [ ] Can click "Sign In" button
- [ ] Sign up modal opens
- [ ] Can create account with email/password
- [ ] Can sign in with email/password
- [ ] Can sign in with Google
- [ ] Profile shows user info
- [ ] Can add API keys
- [ ] Data saves to cloud

## 🎯 What You Get

After setup:
- ✅ Secure user authentication
- ✅ Each user has private data space
- ✅ Cross-device sync
- ✅ Google Sign-In
- ✅ Password reset
- ✅ Local API key storage

## 📚 More Help

- **Detailed Guide**: `docs/FIREBASE_SETUP_GUIDE.md`
- **Full Documentation**: `docs/MULTI_TENANT_AUTH.md`
- **Firebase Docs**: https://firebase.google.com/docs/auth

## 🆘 Still Having Issues?

1. Run: `npm run check-firebase`
2. Check browser console for errors
3. Verify Firebase Console settings
4. Make sure dev server restarted
5. Clear browser cache and try again

---

**Total Time: ~5 minutes | Difficulty: Easy**
