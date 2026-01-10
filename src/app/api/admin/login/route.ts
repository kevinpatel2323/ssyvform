import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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

    const table = process.env.ADMIN_USERS_TABLE ?? "admin_users";

    const result = await query<{ id: string; username: string; password_hash: string }>(
      `SELECT id, username, password_hash FROM ${table} WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const data = result.rows[0];

    const isValid = await verifyPassword(
      password,
      data.password_hash
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

