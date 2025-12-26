import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { verifyPassword, createSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const table = process.env.SUPABASE_ADMIN_USERS_TABLE ?? "admin_users";

    const { data, error } = await supabase
      .from(table)
      .select("id, username, password_hash")
      .eq("username", username)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(
      password,
      data.password_hash as string
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await createSession(data.id);

    return NextResponse.json({ ok: true, user: { id: data.id, username: data.username } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

