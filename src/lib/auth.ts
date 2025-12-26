import { cookies } from "next/headers";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface AdminUser {
  id: string;
  username: string;
  created_at: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  try {
    const supabase = createServiceSupabaseClient();
    const table = process.env.SUPABASE_ADMIN_USERS_TABLE ?? "admin_users";

    // Verify session by checking if user exists
    // In a production app, you'd want a separate sessions table
    // For simplicity, we'll validate the session ID matches a user ID
    const { data, error } = await supabase
      .from(table)
      .select("id, username, created_at")
      .eq("id", sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AdminUser;
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<AdminUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

