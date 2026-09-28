# Biometric Authentication

## Overview
Dai now supports biometric authentication (Face ID, Touch ID, Fingerprint) as a secure fallback for users who forget their PIN.

## Features

### 1. **Biometric Unlock**
- Users can unlock the app using Face ID (iOS) or Fingerprint (Android)
- Biometric button appears on the PIN lock screen when available
- Provides a seamless, secure alternative to PIN entry

### 2. **Forgot PIN Recovery**
- "Forgot PIN?" link on the lock screen
- If biometrics are available: triggers biometric authentication
- If biometrics are NOT available: warns user about data reset requirement

### 3. **Platform Support**
- **iOS**: Face ID support with proper permissions
- **Android**: Fingerprint and face recognition support
- **Web**: Falls back to PIN-only (biometrics not supported)

## How It Works

### User Flow with Biometrics Available:
1. User arrives at PIN lock screen
2. Forgets their PIN and taps "Forgot PIN?"
3. System prompts for Face ID/Touch ID
4. On successful authentication → app unlocks
5. User can continue using the app

### User Flow without Biometrics:
1. User arrives at PIN lock screen
2. Forgets their PIN and taps "Forgot PIN?"
3. System warns: "You'll need to reset all app data"
4. User confirms → redirected to reset database screen
5. All data cleared, user starts fresh

## Technical Implementation

### Files Added:
- `src/features/auth/services/biometricService.ts` - Biometric authentication logic

### Files Modified:
- `src/features/auth/screens/PinLockScreen.tsx` - Added biometric UI and forgot PIN flow
- `app.json` - Added biometric permissions for iOS and Android
- `package.json` - Added `expo-local-authentication` dependency

### Permissions Required:

**iOS (Info.plist):**
```xml
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to unlock Dai and access your financial data securely.</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
```

## API Reference

### `biometricService.ts`

#### `checkBiometricCapabilities()`
Checks if biometric authentication is available on the device.

Returns:
```typescript
{
  isAvailable: boolean;
  biometricType: "fingerprint" | "facial" | "iris" | "none";
  isEnrolled: boolean;
}
```

#### `authenticateWithBiometrics()`
Prompts the user for biometric authentication.

Returns:
```typescript
{
  success: boolean;
  error?: string;
}
```

#### `getBiometricTypeName(type)`
Returns a user-friendly name for the biometric type:
- iOS: "Face ID" or "Touch ID"
- Android: "Face Recognition" or "Fingerprint"

## Security Considerations

1. **No PIN Storage**: The PIN itself is never exposed during biometric authentication
2. **Device Security**: Relies on the device's secure enclave for biometric data
3. **Fallback**: Users can always use their PIN if biometrics fail
4. **No Bypass**: Biometric auth requires the device's biometric system - cannot be spoofed

## Future Enhancements

- [ ] Allow users to disable biometric authentication in settings
- [ ] Add biometric authentication for sensitive operations (deleting accounts, exporting data)
- [ ] Add biometric prompt during PIN setup (opt-in during onboarding)
- [ ] Support for Web Authentication API (WebAuthn) for web platform

## Testing

### To Test on iOS Simulator:
1. Enable Face ID: Features → Face ID → Enrolled
2. Lock the app, tap "Forgot PIN?"
3. In simulator: Features → Face ID → Matching Face

### To Test on Android Emulator:
1. Settings → Security → Screen Lock → PIN
2. Settings → Security → Fingerprint
3. Use the emulator's fingerprint tool to simulate

### To Test on Real Device:
1. Ensure Face ID/Touch ID is set up in device settings
2. Launch Dai, lock the app
3. Tap "Forgot PIN?" and authenticate with biometrics
