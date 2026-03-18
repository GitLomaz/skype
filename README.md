# Skype 1.1 - Cloud Run Deployment

A retro-styled Firebase chat application ready for Google Cloud Run.

## Prerequisites

- Google Cloud Platform account with billing enabled
- Firebase project configured
- Secrets stored in Google Cloud Secret Manager

## Required Secrets in Secret Manager

Create the following secrets in Google Cloud Secret Manager:

- `SKYPE_API_KEY`
- `SKYPE_AUTH_DOMAIN`
- `SKYPE_PROJECT_ID`
- `SKYPE_STORAGE_BUCKET`
- `SKYPE_MESSAGING_SENDER_ID`
- `SKYPE_APP_ID`

## Deploy to Cloud Run (via Console)

### Step 1: Enable Required APIs

1. Go to **APIs & Services** > **Library**
2. Enable:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Secret Manager API

### Step 2: Create Secrets (if not already done)

1. Go to **Security** > **Secret Manager**
2. Click **CREATE SECRET** for each required secret
3. Name them exactly as listed above
4. Paste the corresponding Firebase config values
5. Click **CREATE SECRET**

### Step 3: Deploy to Cloud Run

1. Go to **Cloud Run** in GCP Console
2. Click **CREATE SERVICE**
3. Select **Deploy one revision from an existing container image** OR **Continuously deploy from a repository**

#### Option A: Deploy from Source Code (Recommended)

1. Select **Continuously deploy from a repository (source)**
2. Click **SET UP WITH CLOUD BUILD**
3. Select your repository (GitHub, Bitbucket, etc.)
4. Choose **Dockerfile** as the build type
5. Click **SAVE**

#### Option B: Build and Deploy Manually

1. Build the image locally or via Cloud Build
2. Push to Artifact Registry or Container Registry
3. Select **Deploy one revision from an existing container image**
4. Enter your image URL

### Step 4: Configure the Service

1. **Service name**: `skype-chat`
2. **Region**: Choose your preferred region (e.g., `us-central1`)
3. **Authentication**: Select **Allow unauthenticated invocations**
4. Click **CONTAINER, NETWORKING, SECURITY** to expand advanced settings

### Step 5: Configure Secrets

1. Go to the **VARIABLES & SECRETS** tab
2. Click **REFERENCE A SECRET** for each secret:
   - **Secret**: Select `SKYPE_API_KEY`
   - **Exposed as**: Environment variable
   - **Name**: `SKYPE_API_KEY`
   - Click **DONE**
3. Repeat for all 6 secrets:
   - `SKYPE_AUTH_DOMAIN`
   - `SKYPE_PROJECT_ID`
   - `SKYPE_STORAGE_BUCKET`
   - `SKYPE_MESSAGING_SENDER_ID`
   - `SKYPE_APP_ID`

### Step 6: Configure Container Settings (Optional)

1. **Container port**: `8080` (should be auto-detected)
2. **Memory**: `512 MiB` (default is fine)
3. **CPU**: `1` (default is fine)
4. **Request timeout**: `300` seconds
5. **Maximum requests per container**: `80`

### Step 7: Deploy

1. Click **CREATE** or **DEPLOY**
2. Wait for deployment to complete (2-5 minutes)
3. Click on the service URL to access your chat app

## Local Development

1. Install dependencies:
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
