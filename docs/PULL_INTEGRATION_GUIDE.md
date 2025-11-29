# Pull Mechanism Integration Guide

## Quick Start

The pull mechanism is ready to use. Here are the recommended places to integrate it:

## Option 1: User Profile Modal (Recommended)

Add to `components/UserProfile.tsx` to allow users to pull data from settings:

```typescript
import { DataPull } from './DataPull';

export function UserProfile({ isOpen, onClose, onSignOut }: UserProfileProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Existing profile content */}
      
      {/* Add this section */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Data Management</h3>
        <DataPull onPullComplete={() => {
          // Optionally reload or refresh
          window.location.reload();
        }} />
      </div>
    </Modal>
  );
}
```

## Option 2: Auth Modal (For New Users)

Add to `components/AuthModal.tsx` after successful sign in:

```typescript
import { DataPull } from './DataPull';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [showPull, setShowPull] = useState(false);
  
  const handleAuthSuccess = () => {
    setShowPull(true); // Show pull option after auth
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {!showPull ? (
        // Existing auth form
        <AuthForm onSuccess={handleAuthSuccess} />
      ) : (
        // Show pull option
        <div>
          <h2 className="text-lg font-bold mb-4">Restore Your Data</h2>
          <DataPull onPullComplete={() => {
            onSuccess?.();
            setShowPull(false);
          }} />
        </div>
      )}
    </Modal>
  );
}
```

## Option 3: Standalone Settings Page

Create a new settings component:

```typescript
import { DataPull } from './DataPull';

export function DataSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-4">Data Management</h2>
        <DataPull onPullComplete={() => {
          // Handle completion
        }} />
      </div>
    </div>
  );
}
```

## Option 4: Onboarding Flow

Add to onboarding sequence for new users:

```typescript
import { DataPull } from './DataPull';

export function OnboardingStep() {
  const [step, setStep] = useState(0);
  
  return (
    <div>
      {step === 0 && <SignInStep onNext={() => setStep(1)} />}
      {step === 1 && (
        <div>
          <h2>Restore Your Data</h2>
          <p>Do you have existing PAO data on another device?</p>
          <DataPull onPullComplete={() => setStep(2)} />
          <button onClick={() => setStep(2)}>Skip</button>
        </div>
      )}
      {step === 2 && <CompleteStep />}
    </div>
  );
}
```

## Implementation Steps

### 1. Verify Files Are Created

Check that these files exist:
- `services/pullService.ts` ✓
- `components/DataPull.tsx` ✓
- `hooks/usePullData.ts` ✓
- `services/versionManager.ts` (updated with `createDefaultVersion`) ✓

### 2. Update Imports

In your target component, add:

```typescript
import { DataPull } from './DataPull';
```

### 3. Add Component to JSX

Place the component where you want it to appear:

```typescript
<DataPull onPullComplete={() => {
  // Optional: handle completion
  window.location.reload();
}} />
```

### 4. Test the Integration

1. Sign in on a new device
2. Navigate to where you added DataPull
3. Verify it shows server data availability
4. Click "Pull Data" and verify it works
5. Check that data is restored in the app

## Component Props

```typescript
interface DataPullProps {
  onPullComplete?: () => void;  // Called when pull completes successfully
}
```

## Styling

The component uses Tailwind CSS classes matching the app theme:
- Dark slate background (`bg-slate-800`)
- Indigo/blue accents for primary actions
- Red for destructive actions (clear data)
- Responsive design for mobile and desktop

## Customization

### Change Button Colors

Edit `components/DataPull.tsx`:

```typescript
// Change primary button color
className="bg-blue-600 hover:bg-blue-500"  // Change to your color

// Change clear button color
className="bg-slate-700 hover:bg-slate-600"  // Change to your color
```

### Change Icons

Replace icon imports:

```typescript
import { Download, AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react';
// Use different icons from lucide-react
```

### Add Custom Messages

Modify the component text:

```typescript
<h3 className="font-semibold text-slate-100 mb-1">
  Your custom title here
</h3>
```

## Troubleshooting

### Pull button is disabled

Possible causes:
- User not authenticated (sign in first)
- No data on server (create data first)
- Local data already exists (clear local data first)

### Pull fails with network error

- Check internet connection
- Verify Firebase is configured
- Check browser console for detailed error

### Data not appearing after pull

- Reload the page: `window.location.reload()`
- Check browser console for errors
- Verify Firebase data exists

## API Reference

### pullService.ts

```typescript
// Pull data from server
const result = await pullPAODataFromServer();
// Returns: { success, itemsCount, versionsCount, error?, message? }

// Check if server has data
const info = await checkServerData();
// Returns: { hasData, itemsCount, versionsCount, error? }

// Clear local data
clearLocalData();
```

### usePullData Hook

```typescript
const {
  isLoading,      // boolean - pull in progress
  isChecking,     // boolean - server check in progress
  pullResult,     // PullResult | null
  serverData,     // ServerDataInfo | null
  checkServer,    // () => Promise<ServerDataInfo>
  pull,           // () => Promise<PullResult>
  clearLocal      // () => boolean
} = usePullData();
```

## Next Steps

1. Choose integration location (UserProfile, AuthModal, etc.)
2. Add DataPull component to your chosen location
3. Test with real Firebase data
4. Customize styling if needed
5. Deploy and monitor usage

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify Firebase configuration
3. Ensure user is authenticated
4. Check that server data exists
