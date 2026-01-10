import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || null;

    const table = process.env.REGISTRATIONS_TABLE ?? "registrations";

    // Get total count (always get full count regardless of city filter)
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${table}`
    );
    const totalCount = parseInt(totalResult.rows[0]?.count || "0", 10);

    // Get city counts for dropdown (all cities with counts)
    const cityDataResult = await query<{ city: string }>(
      `SELECT city FROM ${table} WHERE city IS NOT NULL`
    );

    // Count occurrences of each city
    const cityCounts: Record<string, number> = {};
    cityDataResult.rows.forEach((row) => {
      const cityName = row.city;
      if (cityName) {
        cityCounts[cityName] = (cityCounts[cityName] || 0) + 1;
      }
    });

    // Get count for specific city if provided
    let cityCount = null;
    if (city) {
      // Get the count for the specific city
      const filteredResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${table} WHERE city = $1`,
        [city]
      );
      cityCount = parseInt(filteredResult.rows[0]?.count || "0", 10);
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

