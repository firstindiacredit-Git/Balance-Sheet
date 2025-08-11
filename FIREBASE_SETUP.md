# Firebase Setup - Fix Unauthorized Domain Error

## Problem
The error `auth/unauthorized-domain` means your current domain is not authorized in Firebase.

## Solution

### 1. Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `bestsite-e1453`

### 2. Add Authorized Domains
1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain**
3. Add these domains:
   - `localhost` (for development)
   - `127.0.0.1` (for development)
   - Your production domain (if any)

### 3. Current Firebase Config
```javascript
{
  apiKey: "AIzaSyBedqwAr6gEoSf-nSZcf_zLn2Xe5MGVn80",
  authDomain: "bestsite-e1453.firebaseapp.com",
  projectId: "bestsite-e1453",
  storageBucket: "bestsite-e1453.appspot.com",
  messagingSenderId: "62210888916",
  appId: "1:62210888916:web:e4eb1f3d1c9559503a1741"
}
```

### 4. Test Domains to Add
- `localhost`
- `127.0.0.1`
- `localhost:3000`
- `localhost:5173`

### 5. Alternative: Use Environment Variables
Create `.env` file in frontend:
```env
REACT_APP_FIREBASE_API_KEY=AIzaSyBedqwAr6gEoSf-nSZcf_zLn2Xe5MGVn80
REACT_APP_FIREBASE_AUTH_DOMAIN=bestsite-e1453.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=bestsite-e1453
REACT_APP_FIREBASE_STORAGE_BUCKET=bestsite-e1453.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=62210888916
REACT_APP_FIREBASE_APP_ID=1:62210888916:web:e4eb1f3d1c9559503a1741
```

## Quick Fix Steps:
1. Go to Firebase Console
2. Authentication → Settings → Authorized domains
3. Add: `localhost`, `127.0.0.1`
4. Save changes
5. Test Google login again

## Common Issues:
- **Development**: Make sure `localhost` is added
- **Production**: Add your actual domain
- **HTTPS**: Production domains must use HTTPS
- **Subdomains**: Add each subdomain separately 