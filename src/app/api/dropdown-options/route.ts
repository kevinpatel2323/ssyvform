import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

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

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from(type)
      .select("name")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      options: (data || []).map((item) => item.name),
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

    const supabase = createServiceSupabaseClient();
    const trimmedName = name.trim();

    // Try to insert the new option
    const { data, error } = await supabase
      .from(type)
      .insert({ name: trimmedName })
      .select("name")
      .single();

    if (error) {
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

    return NextResponse.json({
      success: true,
      option: data.name,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
