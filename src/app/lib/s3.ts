// app/lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectVersionsCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";

const REGION = process.env.NEXT_PUBLIC_AWS_REGION!;
const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET!;

if (!REGION || !BUCKET) {
  throw new Error("Missing NEXT_PUBLIC_AWS_REGION or NEXT_PUBLIC_S3_BUCKET env vars");
}

declare global {
  // cache in dev to avoid recreation on HMR
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __s3Client__: any | undefined;
}

const s3Client: S3Client =
  // @ts-ignore
  global.__s3Client__ ??
  new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID || "",
      secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
    },
  });

if (process.env.NODE_ENV !== "production") global.__s3Client__ = s3Client;

export async function uploadBufferToS3({
  buffer,
  filename,
  contentType,
}: {
  buffer: Buffer;
  filename: string;
  contentType?: string;
}) {
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const key = `admin/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType || "application/octet-stream",
  });

  await s3Client.send(cmd);

  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return { key, publicUrl };
}

/**
 * deleteS3Object: accepts an S3 key or a full public URL and deletes it.
 * Returns { deleted: boolean, reason?: string, detail?: any }
 */
export async function deleteS3Object(keyOrUrl?: string | null) {
  if (!keyOrUrl) return { deleted: false, reason: "no-key-provided" };

  // normalize to key
  let key = keyOrUrl;
  try {
    if (typeof keyOrUrl === "string" && (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://"))) {
      const parsed = new URL(keyOrUrl);
      let path = parsed.pathname || "";
      if (path.startsWith("/")) path = path.slice(1);
      // remove bucket prefix if present
      if (path.startsWith(`${BUCKET}/`)) path = path.slice(BUCKET.length + 1);
      key = decodeURIComponent(path);
    }
  } catch (e) {
    // fall back to original string
  }

  if (!key) return { deleted: false, reason: "extracted-key-empty" };

  try {
    console.info(`[S3] deleting object -> Bucket="${BUCKET}" Key="${key}"`);

    // Try HeadObject to see if object exists
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    } catch (headErr: any) {
      if (headErr.name === "NotFound" || headErr.$metadata?.httpStatusCode === 404) {
        console.info(`[S3] HeadObject: not found for key="${key}"`);
        return { deleted: false, reason: "object-not-found" };
      }
      console.warn("[S3] HeadObject error (continuing):", headErr);
    }

    // Standard delete
    try {
      const delRes = await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
      console.info("[S3] DeleteObject sent:", delRes);
    } catch (delErr) {
      console.error("[S3] DeleteObject failed:", delErr);
      // continue to versioned-delete attempt
    }

    // If bucket has versioning, object may still appear — list versions and delete them.
    try {
      // re-check existence
      let exists = false;
      try {
        await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
        exists = true;
      } catch {
        exists = false;
      }

      if (exists) {
        console.info("[S3] Object still exists after DeleteObject — listing versions to remove");
        const versionsRes = await s3Client.send(new ListObjectVersionsCommand({ Bucket: BUCKET, Prefix: key }));

        const objectsToDelete: Array<{ Key: string; VersionId?: string }> = [];

        if (versionsRes.Versions) {
          for (const v of versionsRes.Versions) {
            if (v.Key === key && v.VersionId) objectsToDelete.push({ Key: key, VersionId: v.VersionId });
          }
        }
        if (versionsRes.DeleteMarkers) {
          for (const dm of versionsRes.DeleteMarkers) {
            if (dm.Key === key && dm.VersionId) objectsToDelete.push({ Key: key, VersionId: dm.VersionId });
          }
        }

        if (objectsToDelete.length > 0) {
          const batch = {
            Bucket: BUCKET,
            Delete: { Objects: objectsToDelete.map((o) => ({ Key: o.Key, VersionId: o.VersionId })) },
          };
          const batchRes = await s3Client.send(new DeleteObjectsCommand(batch));
          console.info("[S3] DeleteObjects result:", batchRes);
        } else {
          console.info("[S3] no versions/delete markers found for key:", key);
        }

        // final head check
        try {
          await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
          console.warn("[S3] after version deletion attempts, object still exists.");
          return { deleted: false, reason: "still-exists-after-attempts" };
        } catch {
          console.info("[S3] object removed (versions cleared).");
          return { deleted: true };
        }
      } else {
        // not found after DeleteObject — success
        return { deleted: true };
      }
    } catch (verErr) {
      console.error("[S3] version-handling error:", verErr);
      return { deleted: false, reason: "version-handling-failed", detail: verErr };
    }
  } catch (err) {
    console.error("[S3] deleteS3Object fatal:", err);
    return { deleted: false, reason: "fatal", detail: err };
  }
}

export default s3Client;
