import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || null;

    const supabase = createServiceSupabaseClient();
    const table = process.env.SUPABASE_REGISTRATIONS_TABLE ?? "registrations";

    // Get total count (always get full count regardless of city filter)
    const { count: totalCount, error: totalError } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (totalError) {
      return NextResponse.json(
        { error: totalError.message },
        { status: 500 }
      );
    }

    // Get city counts for dropdown (all cities with counts)
    const { data: cityData, error: cityError } = await supabase
      .from(table)
      .select("city");

    if (cityError) {
      return NextResponse.json(
        { error: cityError.message },
        { status: 500 }
      );
    }

    // Count occurrences of each city
    const cityCounts: Record<string, number> = {};
    if (cityData) {
      cityData.forEach((row) => {
        const cityName = row.city;
        if (cityName) {
          cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
        }
      });
    }

    // Get count for specific city if provided
    let cityCount = null;
    if (city) {
      // Get the count for the specific city
      const { count: filteredCount, error: filteredError } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("city", city);

      if (filteredError) {
        return NextResponse.json(
          { error: filteredError.message },
          { status: 500 }
        );
      }
      
      cityCount = filteredCount || 0;
    }

    return NextResponse.json({
      totalEntries: totalCount || 0,
      cityCount: cityCount,
      cityCounts: cityCounts,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

