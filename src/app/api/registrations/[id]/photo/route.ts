import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function parseExpiresInSeconds(url: URL) {
  const raw = url.searchParams.get("expiresIn");
  if (!raw) return 60 * 10;

  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber)) return 60 * 10;

  const clamped = Math.max(60, Math.min(60 * 60, Math.floor(asNumber)));
  return clamped;
}

function assertAuthorized(request: Request) {
  const adminToken = process.env.REGISTRATIONS_ADMIN_TOKEN;
  if (!adminToken) return;

  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${adminToken}`;

  if (authHeader !== expected) {
    throw new Error("Unauthorized");
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertAuthorized(request);

    const { id } = await context.params;
    const expiresIn = parseExpiresInSeconds(new URL(request.url));

    const supabase = createServiceSupabaseClient();

    const table = process.env.SUPABASE_REGISTRATIONS_TABLE ?? "registrations";

    const registrationRes = await supabase
      .from(table)
      .select("photo_bucket, photo_path")
      .eq("id", id)
      .single();

    if (registrationRes.error) {
      return NextResponse.json(
        { error: registrationRes.error.message },
        { status: 404 }
      );
    }

    const { photo_bucket: bucket, photo_path: path } = registrationRes.data as {
      photo_bucket: string;
      photo_path: string;
    };

    const signedRes = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (signedRes.error) {
      return NextResponse.json(
        { error: signedRes.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signedRes.data.signedUrl, expiresIn });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
