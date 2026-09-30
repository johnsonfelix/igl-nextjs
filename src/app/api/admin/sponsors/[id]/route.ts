
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { uploadBufferToS3, deleteS3Object } from "@/app/lib/s3";


function extractIdFromReq(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

export async function DELETE(req: NextRequest) {
  try {
    const id = extractIdFromReq(req);

    
    const existing = await prisma.sponsorType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    
    const keyToDelete = existing.imageKey ?? existing.image ?? null;
    if (keyToDelete) {
      try {
        const res = await deleteS3Object(keyToDelete);
        console.info("[SPONSOR_DELETE] deleteS3Object result:", res);
      } catch (err) {
        console.warn("[SPONSOR_DELETE] failed to remove S3 object:", err);
        
      }
    }

    await prisma.sponsorType.delete({ where: { id } });

    return NextResponse.json({ message: "Sponsor type deleted successfully" });
  } catch (error) {
    console.error("[SPONSOR_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete sponsor type" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = extractIdFromReq(req);

    const existing = await prisma.sponsorType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Sponsor not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";

    // defaults from existing
    let name = existing.name;
    let description = existing.description;
    let price: number = existing.price as number;
    let image = existing.image ?? null;
    let imageKey = existing.imageKey ?? null;
    let removeImage = false;
    let features = existing.features || [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      const nameField = formData.get("name");
      const descField = formData.get("description");
      const priceField = formData.get("price");
      const removeField = formData.get("removeImage");

      if (typeof nameField === "string") name = nameField;
      if (typeof descField === "string") description = descField;
      if (priceField !== null) price = Number(String(price));
      if (typeof removeField === "string" && (removeField === "true" || removeField === "1")) {
        removeImage = true;
      }

      const file = formData.get("image") as File | null;
      if (file && file.size && typeof file.arrayBuffer === "function") {
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const filename = (file as any).name || `upload-${Date.now()}.bin`;
        const ctype = (file as any).type || "application/octet-stream";

        const { key, publicUrl } = await uploadBufferToS3({
          buffer,
          filename,
          contentType: ctype,
        });

        
        const oldKey = imageKey ?? image ?? null;
        if (oldKey) {
          try {
            const res = await deleteS3Object(oldKey);
            console.info("[SPONSOR_PUT] deleted previous S3 object:", res);
          } catch (err) {
            console.warn("[SPONSOR_PUT] failed to delete previous S3 object:", err);
          }
        }

        image = publicUrl;
        imageKey = key;
      } else {
        
        const imageUrlField = formData.get("imageUrl");
        const imageKeyField = formData.get("imageKey");

        if (typeof imageKeyField === "string" && imageKeyField !== "") {
          // client supplied explicit imageKey
          // if we are replacing a previously managed S3 key, delete it
          const oldKey = imageKey ?? image ?? null;
          if (oldKey && oldKey !== imageKeyField) {
            try {
              const res = await deleteS3Object(oldKey);
              console.info("[SPONSOR_PUT] deleted previous S3 object:", res);
            } catch (err) {
              console.warn("[SPONSOR_PUT] failed to delete previous S3 object:", err);
            }
          }
          imageKey = imageKeyField;
          // if they also provided imageUrl, prefer it
          if (typeof imageUrlField === "string") image = imageUrlField;
        } else if (typeof imageUrlField === "string") {
          
          const newImageUrl = imageUrlField === "" ? null : imageUrlField;
          if (newImageUrl === null) {
            // cleared by client
            removeImage = true;
          } else {
            image = newImageUrl;
            // attempt to extract key (use same logic as upload's post-handler)
            try {
              const maybeKey = (() => {
                try {
                  const u = new URL(newImageUrl);
                  let p = u.pathname || "";
                  if (p.startsWith("/")) p = p.slice(1);
                  const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET;
                  if (BUCKET && p.startsWith(`${BUCKET}/`)) p = p.slice(BUCKET.length + 1);
                  return decodeURIComponent(p);
                } catch {
                  const regex = /(sponsors\/[\w\-+.%,()~!$'@=&;\/]+)$/;
                  const m = newImageUrl.match(regex);
                  return m && m[1] ? decodeURIComponent(m[1]) : null;
                }
              })();
              if (maybeKey) imageKey = maybeKey;
              else imageKey = null;
            } catch {
              imageKey = null;
            }
          }
        }
      }

      // Handle features from FormData
      const featuresField = formData.get("features");
      if (typeof featuresField === "string") {
        try {
          features = JSON.parse(featuresField);
        } catch {
          features = [];
        }
      }
    } else {
      
      const body = await req.json();

      if (body.name !== undefined) name = body.name;
      if (body.description !== undefined) description = body.description;
      if (body.price !== undefined) price = Number(body.price);

      if (body.removeImage === true || body.removeImage === "true") {
        removeImage = true;
      }

      if (body.imageKey !== undefined) {
        const newKey = body.imageKey;
        const newImageUrl = body.image ?? image;

        if (newKey && newKey !== imageKey) {
          
          const oldKey = imageKey ?? image ?? null;
          if (oldKey) {
            try {
              await deleteS3Object(oldKey);
            } catch (err) {
              console.warn("[SPONSOR_PUT] failed to delete previous S3 object:", err);
            }
          }
          imageKey = newKey;
          image = newImageUrl ?? null;
        } else if (newKey === null) {
          
          const oldKey = imageKey ?? image ?? null;
          if (oldKey) {
            try {
              await deleteS3Object(oldKey);
            } catch (err) {
              console.warn("[SPONSOR_PUT] failed to delete previous S3 object on clear:", err);
            }
          }
          imageKey = null;
          image = body.image ?? null;
        }
      } else if (body.image !== undefined) {
        
        image = body.image;
        
        if (typeof body.image === "string" && body.image !== "") {
          try {
            const u = new URL(body.image);
            let p = u.pathname || "";
            if (p.startsWith("/")) p = p.slice(1);
            const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET;
            if (BUCKET && p.startsWith(`${BUCKET}/`)) p = p.slice(BUCKET.length + 1);
            imageKey = decodeURIComponent(p);
          } catch {
            const regex = /(sponsors\/[\w\-+.%,()~!$'@=&;\/]+)$/;
            const m = (body.image as string).match(regex);
            imageKey = m && m[1] ? decodeURIComponent(m[1]) : null;
          }
        } else {
          imageKey = null;
        }
      }

      // Handle features from JSON body
      if (body.features !== undefined) {
        features = Array.isArray(body.features) ? body.features : [];
      }
    }

    // handle removeImage flag (delete old image key if present)
    if (removeImage) {
      const oldKey = imageKey ?? image ?? null;
      if (oldKey) {
        try {
          const res = await deleteS3Object(oldKey);
          console.info("[SPONSOR_PUT] deleteS3Object result (removeImage):", res);
        } catch (err) {
          console.warn("[SPONSOR_PUT] failed to delete S3 object on removeImage:", err);
        }
      }
      image = null;
      imageKey = null;
    }

    // validate price
    if (isNaN(Number(price))) {
      return NextResponse.json({ error: "Invalid price: must be a number" }, { status: 400 });
    }

    const sponsor = await prisma.sponsorType.update({
      where: { id },
      data: {
        name,
        description,
        price: Number(price),
        image: image,
        imageKey: imageKey,
        features: features || [],
      },
    });

    console.info("[SPONSOR_PUT] updated sponsor id=", id, "imageKey=", imageKey);
    return NextResponse.json(sponsor);
  } catch (error: any) {
    console.error("[SPONSOR_PUT]", error);
    return NextResponse.json(
      { error: "Failed to update sponsor type", detail: error?.message ?? String(error) },
      { status: 500 }
    );
  }
}
