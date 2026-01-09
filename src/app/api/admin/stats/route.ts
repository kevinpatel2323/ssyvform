import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const gender = (searchParams.get("gender") || "").trim();

    const supabase = createServiceSupabaseClient();
    const table = process.env.SUPABASE_REGISTRATIONS_TABLE ?? "registrations";

    const applyGenderFilter = (query: any): any => {
      if (!gender) return query;
      // Use case-insensitive exact match to handle values like "Male" vs "male"
      return query.ilike("gender", gender);
    };

    // Get total registrations
    const { count: totalRegistrations, error: totalError } = await applyGenderFilter(
      supabase
        .from(table)
        .select("*", { count: "exact", head: true })
    );

    if (totalError) {
      return NextResponse.json({ error: totalError.message }, { status: 500 });
    }

    // Get verification stats
    const { data: verificationData, error: verificationError } = await applyGenderFilter(
      supabase
        .from(table)
        .select("verified")
    );

    if (verificationError) {
      return NextResponse.json({ error: verificationError.message }, { status: 500 });
    }

    const verifiedCount = (verificationData as Array<{ verified: boolean }> | null)
      ?.filter((reg) => reg.verified).length || 0;
    const unverifiedCount = ((verificationData as Array<{ verified: boolean }> | null)?.length || 0) - verifiedCount;

    // Get gender distribution
    const { data: genderData, error: genderError } = await supabase
      .from(table)
      .select("gender")
      .not("gender", "is", null);

    if (genderError) {
      return NextResponse.json({ error: genderError.message }, { status: 500 });
    }

    const genderDistribution = (genderData as Array<{ gender: string | null }> | null)?.reduce((acc: Record<string, number>, reg: { gender: string | null }) => {
      const gender = reg.gender?.toLowerCase() || "unknown";
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get cities by registrations
    const { data: cityData, error: cityError } = await applyGenderFilter(
      supabase
        .from(table)
        .select("city")
        .not("city", "is", null)
    );

    if (cityError) {
      return NextResponse.json({ error: cityError.message }, { status: 500 });
    }

    const citiesByRegistrations = (cityData as Array<{ city: string | null }> | null)?.reduce((acc: Record<string, number>, reg) => {
      const city = reg.city || "Unknown";
      acc[city] = (acc[city] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get marital status distribution
    const { data: maritalData, error: maritalError } = await applyGenderFilter(
      supabase
        .from(table)
        .select("marital_status")
        .not("marital_status", "is", null)
    );

    if (maritalError) {
      return NextResponse.json({ error: maritalError.message }, { status: 500 });
    }

    const maritalStatusDistribution = (maritalData as Array<{ marital_status: string | null }> | null)?.reduce((acc: Record<string, number>, reg) => {
      const status = reg.marital_status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get native place distribution
    const { data: nativePlaceData, error: nativePlaceError } = await applyGenderFilter(
      supabase
        .from(table)
        .select("native_place")
        .not("native_place", "is", null)
    );

    if (nativePlaceError) {
      return NextResponse.json({ error: nativePlaceError.message }, { status: 500 });
    }

    const nativePlaceDistribution = (nativePlaceData as Array<{ native_place: string | null }> | null)?.reduce((acc: Record<string, number>, reg) => {
      const place = reg.native_place || "Unknown";
      acc[place] = (acc[place] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get age distribution from birthday
    const { data: birthdayData, error: birthdayError } = await applyGenderFilter(
      supabase
        .from(table)
        .select("birthday")
        .not("birthday", "is", null)
    );

    if (birthdayError) {
      return NextResponse.json({ error: birthdayError.message }, { status: 500 });
    }

    const ageDistribution = (birthdayData as Array<{ birthday: string | null }> | null)?.reduce((acc: Record<string, number>, reg) => {
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
