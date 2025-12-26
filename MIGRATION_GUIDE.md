# Database Migration Guide

This guide explains how to update your database to support the new name field structure.

## Overview

The registration form now uses three separate name fields:
- `first_name` (required)
- `middle_name` (optional)
- `last_name` (required)

The database migration adds these new columns and migrates existing data from the `name` field.

## Migration Steps

1. **Run the SQL migration** in your Supabase SQL editor or database client:

```sql
-- See: supabase/migrations/update_registrations_name_fields.sql
```

Or copy and paste the contents of `supabase/migrations/update_registrations_name_fields.sql` into your SQL editor and execute it.

2. **Verify the migration** by checking a few records:

```sql
SELECT id, name, first_name, middle_name, last_name 
FROM registrations 
LIMIT 10;
```

3. **Optional: Drop the old name column** (after verifying everything works):

```sql
ALTER TABLE registrations DROP COLUMN IF EXISTS name;
```

⚠️ **Important**: Only drop the `name` column after you've verified that all data was migrated correctly and your application is working as expected.

## What the Migration Does

1. Adds three new columns: `first_name`, `middle_name`, `last_name`
2. Migrates existing data by splitting the `name` field:
   - Single word names → `first_name` only
   - Two word names → `first_name` and `last_name`
   - Three+ word names → `first_name`, `middle_name` (all middle words), and `last_name`

## Backward Compatibility

The `name` column is kept during migration for backward compatibility. The API continues to populate it by concatenating the three name fields, so existing code that reads the `name` field will continue to work.

## Notes

- The migration is idempotent (safe to run multiple times)
- Existing data is preserved
- New registrations will populate all four fields (name, first_name, middle_name, last_name)

