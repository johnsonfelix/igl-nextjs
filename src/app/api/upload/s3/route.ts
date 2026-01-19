import { NextRequest, NextResponse } from "next/server";
import { uploadBufferToS3 } from "@/app/lib/s3";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Only image files are allowed" },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to S3 using existing helper
        const { publicUrl } = await uploadBufferToS3({
            buffer,
            filename: file.name,
            contentType: file.type,
        });

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error("Error uploading to S3:", error);
        return NextResponse.json(
            { error: "Failed to upload file" },
            { status: 500 }
        );
    }
}
