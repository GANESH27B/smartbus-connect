# Authentication Setup

This project uses Firebase Authentication. To make it work, you need to configure Firebase and add the necessary environment variables.

## 1. Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Add a new project.
3. Register a web app in the project settings.

## 2. Enable Authentication Providers
1. Go to "Authentication" > "Sign-in method" in your Firebase project.
2. Enable **Email/Password**.
3. Enable **Google**.
   - You might need to configure the OAuth consent screen in Google Cloud Console if prompted.

## 3. Environment Variables
Add the following keys to your `.env` file in the `web` directory. You can find these values in your Firebase Project Settings under "SDK setup and configuration" (select the "Config" option).

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 4. Restart Development Server
After adding the environment variables, restart your Next.js server:
```bash
npm run dev
```

## Features Implemented
- **Login & Sign Up**: Integrated into a single page with tabs at `/login`.
- **Google Authentication**: One-click sign-in with Google.
- **User Menu**: The header now displays the user's avatar and a logout option when signed in.
- **Protected Routes**: You can use the `useAuth` hook to protect routes or components.
