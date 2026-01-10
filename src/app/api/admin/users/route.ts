import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const table = process.env.ADMIN_USERS_TABLE ?? "admin_users";

    // Check if username already exists
    const existingUserResult = await query<{ id: string }>(
      `SELECT id FROM ${table} WHERE username = $1`,
      [username]
    );

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await query<{ id: string; username: string; created_at: string }>(
      `INSERT INTO ${table} (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at`,
      [username, passwordHash]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const data = result.rows[0];

    return NextResponse.json({
      ok: true,
      user: {
        id: data.id,
        username: data.username,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

