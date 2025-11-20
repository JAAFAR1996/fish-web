import 'server-only';

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import {
  getR2AccessKeyId,
  getR2AccountId,
  getR2SecretAccessKey,
} from '@/lib/env.server';
import { getR2PublicUrl } from '@/lib/env';

let r2Client: S3Client | null = null;

const MULTIPART_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5MB

function getR2Client(): S3Client {
  if (!r2Client) {
    const accountId = getR2AccountId();
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: getR2AccessKeyId(),
        secretAccessKey: getR2SecretAccessKey(),
      },
    });
  }

  return r2Client;
}

export function getPublicUrl(bucket: string, key: string): string {
  const baseUrl = getR2PublicUrl().replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  return `${baseUrl}/${bucket}/${cleanKey}`;
}

export async function uploadFile(
  bucket: string,
  key: string,
  file: Uint8Array,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  const size = file.byteLength;
  const filename = key.split('/').pop() ?? 'file';
  const safeFilename = filename.replace(/"/g, '');

  const objectParams = {
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
    ContentDisposition: `inline; filename="${safeFilename}"`,
  };

  try {
    if (size < MULTIPART_THRESHOLD_BYTES) {
      await client.send(new PutObjectCommand(objectParams));
    } else {
      const upload = new Upload({
        client,
        params: objectParams,
        queueSize: 4,
        partSize: MULTIPART_THRESHOLD_BYTES,
        leavePartsOnError: false,
      });

      await upload.done();
    }
  } catch (error) {
    console.error('[R2 Storage] Failed to upload file', {
      bucket,
      key,
      error,
    });
    throw error;
  }

  return getPublicUrl(bucket, key);
}

export async function deleteFile(bucket: string, key: string): Promise<void> {
  const client = getR2Client();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  } catch (error) {
    console.error('[R2 Storage] Failed to delete file', {
      bucket,
      key,
      error,
    });
  }
}

export async function deleteFiles(bucket: string, keys: string[]): Promise<void> {
  if (!keys.length) {
    return;
  }

  const client = getR2Client();

  try {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: keys.map((key) => ({ Key: key })),
        },
      }),
    );
  } catch (error) {
    console.error('[R2 Storage] Failed to delete files', {
      bucket,
      keys,
      error,
    });
  }
}
