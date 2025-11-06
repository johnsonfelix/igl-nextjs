// app/api/upload-url/route.ts
import { NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import s3Client from "@/app/lib/s3";

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.AWS_REGION;

// Optional whitelist to avoid arbitrary key prefixes
const ALLOWED_FOLDERS = ["admin", "avatars", "products", "posts", "misc"];

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const filename = (url.searchParams.get("filename") || `upload-${Date.now()}`).slice(0, 256);
    const contentType = url.searchParams.get("contentType") || "application/octet-stream";
    const folderParam = url.searchParams.get("folder") || "admin";

    // sanitize folder and validate against whitelist
    const safeFolder = folderParam.replace(/[^a-zA-Z0-9\-_]/g, "") || "admin";
    if (!ALLOWED_FOLDERS.includes(safeFolder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    // sanitize filename (basic)
    const safeName = filename.replace(/[^a-zA-Z0-9.\-_(),%~!$'@=&;]/g, "_");

    const key = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

    const presignedPost = await createPresignedPost(s3Client, {
      Bucket: BUCKET!,
      Key: key,
      Expires: 300, // seconds
      Fields: { "Content-Type": contentType },
      Conditions: [["eq", "$Content-Type", contentType]],
    });

    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ post: presignedPost, publicUrl, key, contentType });
  } catch (err) {
    console.error("Failed to create presigned POST:", err);
    return NextResponse.json(
      { error: "Could not create presigned POST", details: String(err) },
      { status: 500 }
    );
  }
}
