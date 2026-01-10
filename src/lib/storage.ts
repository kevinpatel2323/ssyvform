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
    
    if (process.env.GCS_KEY) {
      const key = JSON.parse(process.env.GCS_KEY);
      storageClient = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        credentials: key,
      });
    } else {
      storageClient = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
      });
    }
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
  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInSeconds * 1000,
  });

  return url;
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
