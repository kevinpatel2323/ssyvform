import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const runtime = "nodejs";

// GET endpoint to fetch all dropdown options
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'cities', 'states', or 'native_places'

    if (!type || !["cities", "states", "native_places"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'cities', 'states', or 'native_places'" },
        { status: 400 }
      );
    }

    const result = await query<{ name: string }>(
      `SELECT name FROM ${type} ORDER BY name ASC`
    );

    return NextResponse.json({
      options: result.rows.map((item) => item.name),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST endpoint to add a new option
export async function POST(request: Request) {
  try {
    const { type, name } = await request.json();

    if (!type || !["cities", "states", "native_places"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'cities', 'states', or 'native_places'" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();

    try {
      // Try to insert the new option
      const result = await query<{ name: string }>(
        `INSERT INTO ${type} (name) VALUES ($1) RETURNING name`,
        [trimmedName]
      );

      return NextResponse.json({
        success: true,
        option: result.rows[0].name,
      });
    } catch (error: any) {
      // If it's a unique constraint violation, the option already exists - that's fine
      if (error.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "Option already exists",
          option: trimmedName,
        });
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
