import { NextResponse } from "next/server";
import { query } from "@/lib/db";
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

    const table = process.env.REGISTRATIONS_TABLE ?? "registrations";

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Apply search filter
    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      const searchConditions: string[] = [
        `LOWER(COALESCE(id_text::text, '')) LIKE $${paramIndex}`,
        `LOWER(COALESCE(first_name, '')) LIKE $${paramIndex}`,
        `LOWER(COALESCE(middle_name, '')) LIKE $${paramIndex}`,
        `LOWER(COALESCE(last_name, '')) LIKE $${paramIndex}`,
        `LOWER(COALESCE(phone, '')) LIKE $${paramIndex}`,
        `LOWER(COALESCE(city, '')) LIKE $${paramIndex}`,
        `LOWER(COALESCE(state, '')) LIKE $${paramIndex}`,
        `LOWER(COALESCE(native_place, '')) LIKE $${paramIndex}`,
        `LOWER(COALESCE(zip_code, '')) LIKE $${paramIndex}`,
      ];
      
      // Add serial number exact match if search is numeric
      if (!isNaN(Number(search))) {
        searchConditions.push(`serial_number::text = $${paramIndex + 1}`);
        params.push(searchLower);
        params.push(search);
        paramIndex += 2;
      } else {
        params.push(searchLower);
        paramIndex++;
      }
      
      conditions.push(`(${searchConditions.join(' OR ')})`);
    }

    // Apply gender filter
    if (gender) {
      conditions.push(`gender = $${paramIndex}`);
      params.push(gender);
      paramIndex++;
    }

    // Apply verification filter
    if (verified === 'verified' || verified === 'unverified') {
      conditions.push(`verified = $${paramIndex}`);
      params.push(verified === 'verified');
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
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
    const order = sortOrder === "asc" ? "ASC" : "DESC";

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${table} ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0]?.count || "0", 10);

    // Get paginated results
    const offset = (page - 1) * limit;
    const queryParams = [...params, limit, offset];
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    const dataResult = await query(
      `SELECT * FROM ${table} ${whereClause} ORDER BY ${sortColumn} ${order} LIMIT $${limitParam} OFFSET $${offsetParam}`,
      queryParams
    );
    const data = dataResult.rows;
    const count = totalCount;

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

    const table = process.env.REGISTRATIONS_TABLE ?? 'registrations';

    const result = await query<{ id: string; verified: boolean }>(
      `UPDATE ${table} SET verified = $1 WHERE id = $2 RETURNING id, verified`,
      [verified, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      registration: {
        id: result.rows[0].id,
        verified: result.rows[0].verified
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
