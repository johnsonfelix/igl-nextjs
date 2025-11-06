// lib/s3-upload.ts
export const uploadFileToS3 = async (fileToUpload: File): Promise<string> => {
  const params = new URLSearchParams({
    filename: fileToUpload.name,
    contentType: fileToUpload.type || "application/octet-stream",
  });

  // 1. Request presigned URL from your API
  const presignResp = await fetch(`/api/upload-url?${params.toString()}`);
  if (!presignResp.ok) {
    const body = await presignResp.text().catch(() => "<could not read body>");
    throw new Error(`Failed to get upload URL (status ${presignResp.status}): ${body}`);
  }

  const data = await presignResp.json().catch((e) => {
    throw new Error("Presign endpoint returned invalid JSON: " + String(e));
  });

  // 2. Handle presigned POST
  if (data.post && data.post.url && data.post.fields) {
    const fd = new FormData();
    Object.entries(data.post.fields).forEach(([k, v]) => fd.append(k, v as string));
    fd.append("file", fileToUpload);

    const uploadResp = await fetch(data.post.url, {
      method: "POST",
      body: fd,
    });

    if (!uploadResp.ok) {
      const text = await uploadResp.text().catch(() => "<no body>");
      throw new Error(`S3 POST upload failed: ${uploadResp.status} ${text}`);
    }

    // Construct the public URL
    return data.publicUrl ?? (data.key ? `https://${process.env.NEXT_PUBLIC_NEXT_PUBLIC_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${data.key}` : "");
  }

  // 3. Handle presigned PUT
  if (data.uploadUrl) {
    const signedContentType = data.contentType ?? fileToUpload.type ?? "application/octet-stream";

    const putResp = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": signedContentType,
      },
      body: fileToUpload,
    });

    if (!putResp.ok) {
      const text = await putResp.text().catch(() => "<no body>");
      throw new Error(`Upload to S3 failed: ${putResp.status} ${text}`);
    }

    return data.publicUrl;
  }

  throw new Error("Presign response missing uploadUrl or post fields.");
};
