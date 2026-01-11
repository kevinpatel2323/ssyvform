import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

let storageClient: Storage | null = null;

function getStorageClient(): Storage {
  if (!storageClient) {
    // Initialize Google Cloud Storage client
    // Credentials can be provided via:
    // 1. Environment variable GOOGLE_APPLICATION_CREDENTIALS pointing to service account key file
    // 2. Service account key JSON in GCS_KEY environment variable
    // 3. Default credentials (when running on GCP)
    
    const config: any = {
      projectId: process.env.GCS_PROJECT_ID,
    };
    
    if (process.env.GCS_KEY) {
      const key = JSON.parse(process.env.GCS_KEY);
      config.credentials = key;
    }
    
    storageClient = new Storage(config);
  }
  
  return storageClient;
}

export async function uploadFile(
  bucketName: string,
  fileName: string,
  file: File | Buffer | Readable,
  contentType?: string
): Promise<string> {
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);

  // Check if bucket exists and is accessible
  const [exists] = await bucket.exists();
  if (!exists) {
    throw new Error(`The specified bucket "${bucketName}" does not exist. Please check the bucket name in GCS_PHOTOS_BUCKET environment variable.`);
  }

  const fileRef = bucket.file(fileName);

  let stream: Buffer | Readable;
  if (file instanceof File) {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    stream = Buffer.from(arrayBuffer);
  } else {
    stream = file;
  }

  const options: any = {
    metadata: {
      contentType: contentType || 'application/octet-stream',
    },
    resumable: false,
  };

  await fileRef.save(stream, options);
  
  // Make file publicly readable if needed (or use signed URLs)
  // await fileRef.makePublic();
  
  return fileName;
}

export async function getSignedUrl(
  bucketName: string,
  fileName: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  try {
    const storage = getStorageClient();
    const bucket = storage.bucket(bucketName);

    // Check if bucket exists
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`The specified bucket "${bucketName}" does not exist. Please check the bucket name in GCS_PHOTOS_BUCKET environment variable.`);
    }

    const file = bucket.file(fileName);

    // Check if file exists
    const [fileExists] = await file.exists();
    if (!fileExists) {
      throw new Error(`File "${fileName}" not found in bucket "${bucketName}".`);
    }

    // Use version: 'v4' for better compatibility and to avoid signBlob permission issues
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInSeconds * 1000,
    });

    return url;
  } catch (error) {
    // Provide more detailed error messages
    if (error instanceof Error) {
      // Re-throw with more context if it's our custom error
      if (error.message.includes('does not exist') || error.message.includes('not found')) {
        throw error;
      }
      // For permission errors, provide helpful message
      if (error.message.includes('permission') || error.message.includes('Permission')) {
        throw new Error(`Permission denied. Service account needs 'storage.objects.get' permission on bucket "${bucketName}". Check GCP IAM settings.`);
      }
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
    throw error;
  }
}

export async function deleteFile(bucketName: string, fileName: string): Promise<void> {
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  await file.delete();
}

export async function fileExists(bucketName: string, fileName: string): Promise<boolean> {
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  const [exists] = await file.exists();
  return exists;
}
