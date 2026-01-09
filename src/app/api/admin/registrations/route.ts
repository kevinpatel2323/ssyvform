import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search") || "";
    const gender = searchParams.get("gender") || "";
    const verified = searchParams.get("verified") || "";
    const sortBy = searchParams.get("sortBy") || "id";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const supabase = createServiceSupabaseClient();
    const table = process.env.SUPABASE_REGISTRATIONS_TABLE ?? "registrations";

    let query = supabase.from(table).select("*", { count: "exact" });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.or(
        `id_text.ilike.%${searchLower}%,first_name.ilike.%${searchLower}%,middle_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,phone.ilike.%${searchLower}%,city.ilike.%${searchLower}%,state.ilike.%${searchLower}%,native_place.ilike.%${searchLower}%,zip_code.ilike.%${searchLower}%`
      );
    }

    // Apply gender filter
    if (gender) {
      query = query.eq('gender', gender);
    }

    // Apply verification filter
    if (verified === 'verified' || verified === 'unverified') {
      query = query.eq('verified', verified === 'verified');
    }

    // Apply sorting
    const validSortColumns = [
      "id",
      "serial_number",
      "first_name",
      "middle_name",
      "last_name",
      "gender",
      "marital_status",
      "birthday",
      "city",
      "state",
      "zip_code",
      "phone",
      "native_place",
      "verified",
      "created_at",
    ];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : "id";
    const order = sortOrder === "asc" ? "asc" : "desc";

    query = query.order(sortColumn, { ascending: order === "asc" });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Remove sensitive data if any
    const registrations = (data || []).map((reg: any) => ({
      id: reg.id,
      serial_number: reg.serial_number || '',
      first_name: reg.first_name || '',
      middle_name: reg.middle_name || '',
      last_name: reg.last_name || '',
      name: reg.name || null, // Keep for backward compatibility
      gender: reg.gender || null,
      marital_status: reg.marital_status || null,
      birthday: reg.birthday,
      street: reg.street,
      city: reg.city,
      state: reg.state,
      zip_code: reg.zip_code,
      phone: reg.phone,
      relative_phone: reg.relative_phone || null,
      native_place: reg.native_place,
      photo_bucket: reg.photo_bucket,
      photo_path: reg.photo_path,
      verified: reg.verified || false,
      created_at: reg.created_at,
    }));

    return NextResponse.json({
      registrations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

export async function PATCH(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { id, verified } = await request.json();
    
    if (typeof id === 'undefined' || typeof verified === 'undefined') {
      return NextResponse.json(
        { error: 'Missing required fields: id and verified are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const table = process.env.SUPABASE_REGISTRATIONS_TABLE ?? 'registrations';

    const { data, error } = await supabase
      .from(table)
      .update({ verified })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: data.id,
        verified: data.verified
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
