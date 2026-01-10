# Deploy to Cloud Run

## Prerequisites
- GCP Project with billing enabled
- Cloud SQL PostgreSQL instance running
- Cloud Storage bucket created
- Docker installed locally (for building)

## Step 1: Fill Environment Variables

Edit `.env` file and add your actual values:
- `DATABASE_URL` - Get connection string from Cloud SQL (replace PROJECT_ID:REGION:INSTANCE_NAME)
- `GCS_PROJECT_ID` - Your GCP project ID
- `GCS_PHOTOS_BUCKET` - Your bucket name

## Step 2: Create Service Account

1. Go to GCP Console → **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name: `orchids-sms-sa`
4. Click **Create and Continue**
5. Grant these roles:
   - **Cloud SQL Client**
   - **Storage Object Admin**
6. Click **Done**

## Step 3: Build & Push Docker Image

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Build image
docker build -t gcr.io/$PROJECT_ID/orchids-sms-app:latest .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/orchids-sms-app:latest
```

## Step 4: Deploy to Cloud Run

1. Go to GCP Console → **Cloud Run** → **Create Service**

2. **Basic Settings:**
   - **Container Image**: Browse and select `gcr.io/YOUR_PROJECT_ID/orchids-sms-app:latest`
   - **Service Name**: `orchids-sms-app`
   - **Region**: Choose your region (e.g., us-central1)

3. **Container** tab:
   - Scroll to **Cloud SQL Connections**
   - Click **Add Connection**
   - Select your Cloud SQL instance
   - Click **Done**

4. **Variables & Secrets** tab:
   - Click **Add Variable** for each:
     - `DATABASE_URL` = (from your .env)
     - `GCS_PROJECT_ID` = (from your .env)
     - `GCS_PHOTOS_BUCKET` = (from your .env)
     - `REGISTRATIONS_TABLE` = `registrations` (optional)
     - `ADMIN_USERS_TABLE` = `admin_users` (optional)

5. **Security** tab:
   - **Service Account**: Select `orchids-sms-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com`
   - **Allow unauthenticated invocations**: Check this (if you want public access)

6. Click **Create**

## Step 5: Access Your App

After deployment completes, you'll see a URL like:
`https://orchids-sms-app-xxxxx.run.app`

Click it to access your application!

## Troubleshooting

**Database connection issues:**
- Verify Cloud SQL instance is added in Container tab
- Check DATABASE_URL format matches: `postgresql://USER:PASS@/DB?host=/cloudsql/PROJECT:REGION:INSTANCE`

**Bucket doesn't exist error:**
1. **Verify bucket name:**
   - Go to GCP Console → **Cloud Storage** → **Buckets**
   - Check exact bucket name (case-sensitive)
   - Verify `GCS_PHOTOS_BUCKET` in Cloud Run environment variables matches exactly

2. **Check service account permissions:**
   - Go to **Cloud Storage** → Your bucket → **Permissions** tab
   - Ensure your service account (`orchids-sms-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com`) has:
     - **Storage Object Admin** or at least **Storage Object Creator** role
   - Or grant `storage.objects.create` and `storage.objects.get` permissions

3. **Test bucket access:**
   ```bash
   # List buckets to verify access
   gsutil ls -p YOUR_PROJECT_ID
   
   # Check bucket exists
   gsutil ls gs://YOUR_BUCKET_NAME
   ```

4. **Verify environment variable:**
   - In Cloud Run → **Variables & Secrets** tab
   - `GCS_PHOTOS_BUCKET` should be exactly: `your-bucket-name` (no `gs://` prefix)
   - `GCS_PROJECT_ID` should be your actual project ID

**View logs:**
- In Cloud Run service page, click **Logs** tab
