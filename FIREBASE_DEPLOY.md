# Firebase Deployment Guide

Follow these steps to deploy your SOS Receiver Dashboard to Firebase Hosting.

## 1. Firebase Project Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project (e.g., `sos-dashboard`).
3. Enable **Firestore Database** in Test Mode (for development).
4. Enable **Firebase Hosting**.
5. Enable **Authentication** (Email/Password).

## 2. Local Configuration
1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login to Firebase:
   ```bash
   firebase login
   ```
3. Initialize Firebase in the project root:
   ```bash
   firebase init
   ```
   - Select **Firestore** and **Hosting**.
   - Select your existing project.
   - For public directory, use `dist`.
   - Configure as a single-page app: **Yes**.
   - Set up automatic builds and deploys with GitHub: **No** (optional).

4. Update `src/firebase.js` with your project's configuration (found in Firebase Project Settings > Web App).

## 3. Build and Deploy
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## 4. Firestore Structure
The application expects an `alerts` collection with documents containing:
- `timestamp`: serverTimestamp
- `date`: string (e.g., "2026-05-10")
- `time`: string (e.g., "17:00:00")
- `message`: string
- `lat`: number
- `lng`: number
- `status`: string ("Critical", "Severe", "Normal")
- `battery`: number
- `signal`: number
