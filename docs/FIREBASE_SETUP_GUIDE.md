# Firebase Authentication Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" (or select existing project)
3. Enter project name (e.g., "memodirector")
4. Disable Google Analytics (optional, can enable later)
5. Click "Create project"

### Step 2: Enable Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started" button
3. Go to "Sign-in method" tab
4. Enable these providers:

#### Enable Email/Password:
- Click "Email/Password"
- Toggle "Enable" switch ON
- Click "Save"

#### Enable Google Sign-In:
- Click "Google"
- Toggle "Enable" switch ON
- Select support email from dropdown
- Click "Save"

### Step 3: Enable Firestore Database

1. Click "Firestore Database" in left sidebar
2. Click "Create database"
3. Select "Start in production mode"
4. Choose location (closest to your users)
5. Click "Enable"

### Step 4: Deploy Security Rules

1. Open terminal in your project folder
2. Install Firebase CLI (if not installed):
   ```bash
   npm install -g firebase-tools
   ```

3. Login to Firebase:
   ```bash
   firebase login
   ```

4. Initialize Firebase (if not done):
   ```bash
   firebase init
   ```
   - Select "Firestore" and "Hosting"
   - Choose your project
   - Accept default files

5. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Step 5: Get Firebase Configuration

1. In Firebase Console, click gear icon ⚙️ (Project settings)
2. Scroll down to "Your apps" section
3. Click web icon `</>` to add web app
4. Register app with nickname (e.g., "MemoDirector Web")
5. Copy the configuration values

### Step 6: Configure Your App

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abc123
   ```

3. Save the file

### Step 7: Add Authorized Domains (for Google Sign-In)

1. In Firebase Console → Authentication → Settings
2. Scroll to "Authorized domains"
3. Add your domains:
   - `localhost` (already there)
   - Your production domain (e.g., `memodirector.web.app`)
   - Any other domains you'll use

### Step 8: Test Authentication

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open app in browser
3. Click "Sign In" button
4. Try signing up with email/password
5. Try Google Sign-In

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"

**Problem**: Firebase config not set in `.env`  
**Solution**: 
1. Check `.env` file exists
2. Verify all VITE_FIREBASE_* variables are set
3. Restart dev server after changing `.env`

### "Firebase: Error (auth/operation-not-allowed)"

**Problem**: Email/Password or Google Sign-In not enabled  
**Solution**: 
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password provider
3. Enable Google provider

### "Firebase: Error (auth/unauthorized-domain)"

**Problem**: Domain not authorized for Google Sign-In  
**Solution**:
1. Go to Firebase Console → Authentication → Settings
2. Add your domain to "Authorized domains"

### "Firebase: Error (auth/popup-blocked)"

**Problem**: Browser blocked Google Sign-In popup  
**Solution**:
1. Allow popups for your domain
2. Try again

### "Cannot read properties of null (reading 'uid')"

**Problem**: Firebase not initialized properly  
**Solution**:
1. Check `.env` file has correct values
2. Restart dev server
3. Clear browser cache
4. Check browser console for errors

### "Permission denied" when saving data

**Problem**: Firestore rules not deployed  
**Solution**:
```bash
firebase deploy --only firestore:rules
```

## Verification Checklist

- [ ] Firebase project created
- [ ] Email/Password authentication enabled
- [ ] Google Sign-In enabled
- [ ] Firestore database created
- [ ] Security rules deployed
- [ ] `.env` file configured with Firebase config
- [ ] Authorized domains added
- [ ] Dev server restarted
- [ ] Can sign up with email/password
- [ ] Can sign in with Google
- [ ] Data saves to Firestore

## Firebase Console Quick Links

- **Authentication**: `https://console.firebase.google.com/project/YOUR_PROJECT/authentication`
- **Firestore**: `https://console.firebase.google.com/project/YOUR_PROJECT/firestore`
- **Project Settings**: `https://console.firebase.google.com/project/YOUR_PROJECT/settings/general`

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use environment variables** - Don't hardcode keys
3. **Deploy security rules** - Protect your data
4. **Monitor usage** - Check Firebase Console regularly
5. **Set up billing alerts** - Avoid unexpected charges

## Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform
2. Add production domain to Firebase authorized domains
3. Deploy security rules to production
4. Test authentication on production URL
5. Monitor Firebase Console for errors

## Need Help?

1. Check [Firebase Documentation](https://firebase.google.com/docs/auth)
2. Review error messages in browser console
3. Check Firebase Console logs
4. Verify all setup steps completed

---

**After completing these steps, authentication should work perfectly!**
