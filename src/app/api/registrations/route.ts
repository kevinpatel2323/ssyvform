import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing field: ${key}`);
  }
  return value.trim();
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export async function POST(request: Request) {
  try {
    const supabase = createServiceSupabaseClient();

    const formData = await request.formData();

    // Get name fields and capitalize first letter
    const firstName = capitalizeFirstLetter(requiredString(formData, "firstName"));
    const middleName = capitalizeFirstLetter(requiredString(formData, "middleName"));
    const lastName = capitalizeFirstLetter(requiredString(formData, "lastName"));
    const gender = requiredString(formData, "gender");

    if (gender !== "male" && gender !== "female") {
      return NextResponse.json(
        { error: "Invalid gender value" },
        { status: 400 }
      );
    }

    const birthday = requiredString(formData, "birthday");
    const street = requiredString(formData, "street");
    const city = requiredString(formData, "city");
    const state = requiredString(formData, "state");
    const zipCode = requiredString(formData, "zipCode");
    const phone = requiredString(formData, "phone");
    const nativePlace = requiredString(formData, "nativePlace");

    const photo = formData.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "Photo is required" },
        { status: 400 }
      );
    }

    const bucket = process.env.SUPABASE_PHOTOS_BUCKET ?? "registration-photos";
    const table = process.env.SUPABASE_REGISTRATIONS_TABLE ?? "registrations";

    const extension = photo.name.includes(".")
      ? photo.name.split(".").pop()
      : "jpg";

    const photoPath = `${crypto.randomUUID()}.${extension}`;

    const uploadRes = await supabase.storage
      .from(bucket)
      .upload(photoPath, photo, {
        contentType: photo.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadRes.error) {
      return NextResponse.json(
        { error: uploadRes.error.message },
        { status: 500 }
      );
    }

    // Build insert object with new name fields
    // Note: You must run the migration (update_registrations_name_fields.sql) first
    // to add the first_name, middle_name, and last_name columns to your database
    const insertData = {
      first_name: firstName,
      middle_name: middleName,
      last_name: lastName,
      gender,
      birthday,
      street,
      city,
      state,
      zip_code: zipCode,
      phone,
      native_place: nativePlace,
      photo_bucket: bucket,
      photo_path: photoPath,
    };

    const insertRes = await supabase
      .from(table)
      .insert(insertData)
      .select("id")
      .single();

    if (insertRes.error) {
      return NextResponse.json(
        { error: insertRes.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, id: insertRes.data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
