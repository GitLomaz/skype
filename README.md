# Skype 1.2 - Firebase Chat Application

A retro-styled Firebase chat application with a pure client-side architecture.

## Prerequisites

- Firebase project with Firestore enabled
- Firebase CLI installed (for Firebase Hosting deployment)

## Setup

### 1. Configure Firebase

Edit [main.js](main.js) and replace the placeholder values with your Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

You can find these values in:
- Firebase Console → Project Settings → General → Your apps → Web app

### 2. Configure Firestore Security Rules

In your Firebase Console, set up Firestore security rules to control access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId}/messages/{messageId} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase Hosting:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory: `.` (current directory)
   - Configure as single-page app: `Yes`
   - Don't overwrite index.html: `No`

4. Deploy:
   ```bash
   firebase deploy --only hosting
   ```

5. Access your app at: `https://YOUR_PROJECT_ID.web.app`

### Option 2: GitHub Pages

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Select branch and root folder
4. Your app will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME`

### Option 3: Netlify

1. Drag and drop your project folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repository for automatic deployments

### Option 4: Any Static Host

Simply upload all files to any static hosting service:
- Vercel
- Cloudflare Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

## Local Development

Just open [index.html](index.html) in your browser or use a local server:

```bash
# Python
python -m http.server 8080

# Node.js
npx http-server -p 8080

# PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

## Usage

Add query parameters to customize your experience:

- `?username=YourName` - Set your display name
- `?conversation=room-name` - Join a specific chat room

Example: `https://your-app.web.app/?username=Alice&conversation=lobby`

## Features

- 🔥 Real-time messaging with Firebase
- 💬 Reply to messages
- 🖼️ Image sharing
- 🔔 Desktop notifications
- 🎨 Retro aesthetic
- 📱 Responsive design

## Note on Firebase API Keys

Firebase API keys in client-side code are safe and intended to be public. Security is enforced through Firestore security rules, not by hiding the keys. However, you should still configure proper security rules to protect your data.

## License

MIT
   ```bash
   npm install
   ```

2. Set environment variables:
   ```bash
   export SKYPE_API_KEY=your_api_key
   export SKYPE_AUTH_DOMAIN=your_auth_domain
   export SKYPE_PROJECT_ID=your_project_id
   export SKYPE_STORAGE_BUCKET=your_storage_bucket
   export SKYPE_MESSAGING_SENDER_ID=your_sender_id
   export SKYPE_APP_ID=your_app_id
   ```

3. Run the server:
   ```bash
   npm start
   ```

4. Open http://localhost:8080

## Docker Local Testing

```bash
# Build the image
docker build -t skype-chat .

# Run with environment variables
docker run -p 8080:8080 \
  -e SKYPE_API_KEY=your_key \
  -e SKYPE_AUTH_DOMAIN=your_domain \
  -e SKYPE_PROJECT_ID=your_project \
  -e SKYPE_STORAGE_BUCKET=your_bucket \
  -e SKYPE_MESSAGING_SENDER_ID=your_sender_id \
  -e SKYPE_APP_ID=your_app_id \
  skype-chat
```

## Updating the Deployment

To update the application:

1. Go to **Cloud Run** > Your service
2. Click **EDIT & DEPLOY NEW REVISION**
3. Make changes to:
   - Container image (if updating code)
   - Environment variables or secrets
   - Resource allocation
4. Click **DEPLOY**

## Updating Secrets

1. Go to **Secret Manager**
2. Click on the secret to update
3. Click **NEW VERSION**
4. Enter the new value
5. Click **ADD NEW VERSION**
6. Redeploy your Cloud Run service to use the new version

## Usage

Add username and conversation parameters to the URL:
```
https://your-service-url.run.app?username=YourName&conversation=room1
```

## Troubleshooting

- **502 Bad Gateway**: Check Cloud Run logs for startup errors
- **Secrets not loading**: Verify Secret Manager API is enabled and service account has permissions
- **Firebase errors**: Verify all 6 secrets are configured correctly
- **View logs**: Go to Cloud Run > Your service > LOGS tab
