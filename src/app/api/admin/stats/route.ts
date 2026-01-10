import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const gender = (searchParams.get("gender") || "").trim();

    const table = process.env.REGISTRATIONS_TABLE ?? "registrations";

    // Build WHERE clause for gender filter
    const genderWhere = gender ? `WHERE LOWER(gender) = LOWER($1)` : "";
    const genderParams = gender ? [gender] : [];

    // Get total registrations
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${table} ${genderWhere}`,
      genderParams
    );
    const totalRegistrations = parseInt(totalResult.rows[0]?.count || "0", 10);

    // Get verification stats
    const verificationResult = await query<{ verified: boolean }>(
      `SELECT verified FROM ${table} ${genderWhere}`,
      genderParams
    );

    const verifiedCount = verificationResult.rows.filter((reg) => reg.verified).length;
    const unverifiedCount = verificationResult.rows.length - verifiedCount;

    // Get gender distribution
    const genderResult = await query<{ gender: string }>(
      `SELECT gender FROM ${table} WHERE gender IS NOT NULL`
    );

    const genderDistribution = genderResult.rows.reduce((acc: Record<string, number>, reg: { gender: string }) => {
      const genderValue = reg.gender?.toLowerCase() || "unknown";
      acc[genderValue] = (acc[genderValue] || 0) + 1;
      return acc;
    }, {});

    // Get cities by registrations
    const cityResult = await query<{ city: string }>(
      `SELECT city FROM ${table} ${genderWhere} AND city IS NOT NULL`,
      genderParams
    );

    const citiesByRegistrations = cityResult.rows.reduce((acc: Record<string, number>, reg) => {
      const city = reg.city || "Unknown";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {});

    // Get marital status distribution
    const maritalResult = await query<{ marital_status: string }>(
      `SELECT marital_status FROM ${table} ${genderWhere} AND marital_status IS NOT NULL`,
      genderParams
    );

    const maritalStatusDistribution = maritalResult.rows.reduce((acc: Record<string, number>, reg) => {
      const status = reg.marital_status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Get native place distribution
    const nativePlaceResult = await query<{ native_place: string }>(
      `SELECT native_place FROM ${table} ${genderWhere} AND native_place IS NOT NULL`,
      genderParams
    );

    const nativePlaceDistribution = nativePlaceResult.rows.reduce((acc: Record<string, number>, reg) => {
      const place = reg.native_place || "Unknown";
      acc[place] = (acc[place] || 0) + 1;
      return acc;
    }, {});

    // Get age distribution from birthday
    const birthdayResult = await query<{ birthday: string }>(
      `SELECT birthday FROM ${table} ${genderWhere} AND birthday IS NOT NULL`,
      genderParams
    );

    const ageDistribution = birthdayResult.rows.reduce((acc: Record<string, number>, reg) => {
      if (reg.birthday) {
        const birthDate = new Date(reg.birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        let ageGroup: string;
        if (age < 18) ageGroup = "Under 18";
        else if (age < 25) ageGroup = "18-24";
        else if (age < 35) ageGroup = "25-34";
        else if (age < 45) ageGroup = "35-44";
        else if (age < 55) ageGroup = "45-54";
        else if (age < 65) ageGroup = "55-64";
        else ageGroup = "65+";

        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    return NextResponse.json({
      totalRegistrations: totalRegistrations || 0,
      verificationStats: {
        verified: verifiedCount,
        unverified: unverifiedCount,
      },
      genderDistribution,
      citiesByRegistrations,
      maritalStatusDistribution,
      nativePlaceDistribution,
      ageDistribution,
    });

  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
