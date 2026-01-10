import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSignedUrl } from "@/lib/storage";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

function parseExpiresInSeconds(url: URL) {
  const raw = url.searchParams.get("expiresIn");
  if (!raw) return 60 * 10;

  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber)) return 60 * 10;

  const clamped = Math.max(60, Math.min(60 * 60, Math.floor(asNumber)));
  return clamped;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication via session
    await requireAuth();

    const { id } = await context.params;
    const expiresIn = parseExpiresInSeconds(new URL(request.url));

    const table = process.env.REGISTRATIONS_TABLE ?? "registrations";

    const result = await query<{ photo_bucket: string; photo_path: string }>(
      `SELECT photo_bucket, photo_path FROM ${table} WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    const { photo_bucket: bucket, photo_path: path } = result.rows[0];

    try {
      const signedUrl = await getSignedUrl(bucket, path, expiresIn);
      return NextResponse.json({ url: signedUrl, expiresIn });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to generate signed URL" },
        { status: 500 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

