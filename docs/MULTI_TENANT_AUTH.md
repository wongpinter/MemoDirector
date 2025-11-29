# Multi-Tenant Authentication System

## Overview

MemoDirector now supports multiple users with complete data isolation. Each user has their own private space in Firebase, and API keys are stored locally on each device for maximum privacy and security.

## Key Features

### 🔐 User Authentication
- **Email/Password Sign Up & Sign In**
- **Google Sign-In** (OAuth)
- **Password Reset** via email
- **Session Management** with Firebase Auth

### 🏢 Multi-Tenant Architecture
- Each user gets a unique Firebase path: `users/{userId}/...`
- Complete data isolation between users
- No conflicts when multiple users access the app
- Secure Firestore rules prevent unauthorized access

### 🔑 Local API Key Storage
- AI provider keys stored locally (LocalStorage)
- Keys NEVER sent to server
- Users must set keys on each device
- Supports: Gemini, OpenAI, OpenRouter, Ollama

### 🔄 Cross-Device Sync
- PAO data syncs across user's devices
- Version data syncs automatically
- Real-time updates when signed in
- Offline support with LocalStorage fallback

## User Experience

### First-Time User Flow

1. **Open App** → See "Sign In" button in header
2. **Click Sign In** → Auth modal opens
3. **Choose Method**:
   - Sign up with email/password
   - Sign in with Google
4. **Add API Key** → Click profile → API Keys tab
5. **Start Creating** → PAO data syncs to cloud

### Returning User Flow

1. **Open App** → Automatically signed in
2. **Data Loads** → From Firebase (user-specific)
3. **AI Features Work** → Using locally stored API keys
4. **Changes Sync** → Automatically to user's Firebase space

### Anonymous Mode

Users can still use the app without signing in:
- Data stored locally only
- No cloud sync
- No multi-device support
- "Sign In" button always visible

## Technical Architecture

### Authentication Flow

```
User Action → Firebase Auth → User ID Generated
                                    ↓
                            Database Paths Updated
                                    ↓
                            users/{userId}/pao/...
                            users/{userId}/pao_versions/...
```

### API Key Flow

```
User Adds Key → Stored in LocalStorage
                        ↓
                AI Service Reads Key
                        ↓
                Makes API Call
                        ↓
                (Key never sent to our server)
```

### Data Isolation

```
User A: users/abc123/pao/list
User B: users/xyz789/pao/list
        ↓
    Completely Separate
    (Firestore Rules Enforce)
```

## Setup Instructions

### For Developers

1. **Create Firebase Project**
   ```bash
   # Go to https://console.firebase.google.com/
   # Create new project
   # Enable Authentication (Email/Password + Google)
   # Enable Firestore Database
   ```

2. **Deploy Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Fill in Firebase config values
   ```

4. **Enable Google Sign-In**
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Google provider
   - Add authorized domains

### For Users

1. **Sign Up**
   - Click "Sign In" button
   - Choose "Sign up" tab
   - Enter email, password, and name
   - Or use "Sign in with Google"

2. **Add API Keys**
   - Click profile icon (top right)
   - Go to "API Keys" tab
   - Add your AI provider key
   - Choose model (optional)

3. **Start Using**
   - Create PAO items
   - Data syncs automatically
   - Access from any device (after signing in)

## Security Features

### Firestore Rules

```javascript
// Each user can only access their own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
  
  match /pao/{document=**} {
    allow read, write: if request.auth.uid == userId;
  }
  
  match /pao_versions/{versionId} {
    allow read, write: if request.auth.uid == userId;
  }
}
```

### API Key Security

- **Stored Locally**: Keys in browser LocalStorage
- **Never Transmitted**: Not sent to our servers
- **Device-Specific**: Must be set on each device
- **User-Controlled**: Users manage their own keys

### Data Privacy

- **Isolated Paths**: Each user has unique Firebase path
- **No Cross-Access**: Users cannot see others' data
- **Encrypted Transit**: HTTPS for all Firebase calls
- **Secure Auth**: Firebase Auth handles security

## API Reference

### Authentication Service (`services/auth.ts`)

```typescript
// Sign up new user
signUp(email: string, password: string, displayName?: string): Promise<User>

// Sign in existing user
signIn(email: string, password: string): Promise<User>

// Sign in with Google
signInWithGoogle(): Promise<User>

// Sign out current user
signOut(): Promise<void>

// Reset password
resetPassword(email: string): Promise<void>

// Get current user
getCurrentUser(): User | null

// Get current user ID (for database paths)
getCurrentUserId(): string

// Check if authenticated
isAuthenticated(): boolean

// Listen to auth changes
onAuthChange(callback: (user: User | null) => void): () => void
```

### API Keys Service (`services/apiKeys.ts`)

```typescript
// Save API key
saveAPIKey(config: APIKeyConfig): void

// Load all API keys
loadAPIKeys(): APIKeys

// Get specific API key
getAPIKey(provider: 'gemini' | 'openai' | 'openrouter'): string | null

// Delete API key
deleteAPIKey(provider: keyof APIKeys): void

// Check if any key configured
hasAnyAPIKey(): boolean

// Get available provider
getAvailableProvider(): 'gemini' | 'openai' | 'openrouter' | 'ollama' | null

// Validate API key format
validateAPIKey(provider: string, key: string): boolean

// Mask API key for display
maskAPIKey(key: string): string

// Clear all keys
clearAllAPIKeys(): void
```

## Components

### AuthModal (`components/AuthModal.tsx`)

Modal for sign in, sign up, and password reset.

**Props:**
- `isOpen: boolean` - Show/hide modal
- `onClose: () => void` - Close callback
- `onSuccess: () => void` - Success callback

**Features:**
- Email/password authentication
- Google Sign-In button
- Password reset flow
- Form validation
- Error handling

### UserProfile (`components/UserProfile.tsx`)

User profile and settings modal.

**Props:**
- `isOpen: boolean` - Show/hide modal
- `onClose: () => void` - Close callback
- `onSignOut: () => void` - Sign out callback

**Tabs:**
- **Profile**: User info, sign out
- **API Keys**: Manage AI provider keys

### APIKeysSettings (`components/APIKeysSettings.tsx`)

Manage AI provider API keys.

**Features:**
- Add/edit/delete keys for each provider
- Show/hide key values
- Validate key formats
- Model selection
- Privacy information

## Migration Guide

### From Single-User to Multi-User

Existing data is automatically migrated:

1. **First Sign-In**: User creates account
2. **Data Migration**: LocalStorage data copied to Firebase
3. **User Path**: Data moved to `users/{userId}/...`
4. **Versions Migrated**: All versions preserved
5. **Seamless**: No data loss

### Anonymous to Authenticated

Users can start anonymous and sign in later:

1. **Use Anonymous**: Data in LocalStorage
2. **Sign In**: Create account
3. **Data Uploads**: LocalStorage → Firebase
4. **Sync Enabled**: Now works across devices

## Troubleshooting

### "No AI provider configured"

**Problem**: No API key set  
**Solution**: Go to Profile → API Keys → Add your key

### "Sign in failed"

**Problem**: Invalid credentials  
**Solution**: Check email/password or use password reset

### "Sync not working"

**Problem**: Not signed in  
**Solution**: Click "Sign In" button and authenticate

### "Data not syncing across devices"

**Problem**: Different accounts or anonymous mode  
**Solution**: Sign in with same account on all devices

### "Google Sign-In not working"

**Problem**: Not configured in Firebase  
**Solution**: Enable Google provider in Firebase Console

## Best Practices

### For Users

1. **Use Strong Passwords**: At least 8 characters
2. **Keep Keys Private**: Don't share API keys
3. **Sign In on Each Device**: For cross-device sync
4. **Regular Backups**: Export CSV backups periodically
5. **Secure Email**: Use secure email for account

### For Developers

1. **Deploy Security Rules**: Always deploy firestore.rules
2. **Enable Auth Methods**: Configure in Firebase Console
3. **Monitor Usage**: Check Firebase usage dashboard
4. **Test Security**: Verify rules work correctly
5. **Update Dependencies**: Keep Firebase SDK updated

## Future Enhancements

Potential additions:
- **Email Verification**: Verify email addresses
- **Two-Factor Auth**: Additional security layer
- **Social Logins**: Facebook, Twitter, etc.
- **Account Deletion**: Self-service account deletion
- **Data Export**: Download all user data
- **Sharing**: Share PAO versions with others
- **Teams**: Collaborative PAO creation

## Support

For issues or questions:
1. Check this documentation
2. Review Firestore rules
3. Check Firebase Console logs
4. Verify authentication is enabled
5. Test with different browsers

---

**Built with privacy and security in mind. Your data, your keys, your control.**
