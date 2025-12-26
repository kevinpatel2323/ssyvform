-- -- Migration to split name field into first_name, middle_name, last_name
-- -- This migration adds the new columns

-- -- Step 1: Add new columns (nullable initially to allow migration)
-- ALTER TABLE registrations 
-- ADD COLUMN IF NOT EXISTS first_name TEXT,
-- ADD COLUMN IF NOT EXISTS middle_name TEXT,
-- ADD COLUMN IF NOT EXISTS last_name TEXT;

-- -- Step 2: Migrate existing data from name to the new fields
-- -- For records with existing name, split by spaces:
-- -- - First word -> first_name
-- -- - Last word -> last_name  
-- -- - Middle words -> middle_name (if more than 2 words exist)
-- UPDATE registrations
-- SET 
--   first_name = (string_to_array(TRIM(name), ' '))[1],
--   last_name = CASE 
--     WHEN array_length(string_to_array(TRIM(name), ' '), 1) > 1 
--     THEN (string_to_array(TRIM(name), ' '))[array_length(string_to_array(TRIM(name), ' '), 1)]
--     ELSE NULL
--   END,
--   middle_name = CASE 
--     WHEN array_length(string_to_array(TRIM(name), ' '), 1) > 2 
--     THEN array_to_string(
--       (string_to_array(TRIM(name), ' '))[2:array_length(string_to_array(TRIM(name), ' '), 1)-1], 
--       ' '
--     )
--     ELSE NULL
--   END
-- WHERE name IS NOT NULL 
--   AND name != ''
--   AND (first_name IS NULL OR last_name IS NULL);

-- -- Step 3: Set empty string for middle_name where it's NULL (for records migrated from old data)
-- UPDATE registrations
-- SET middle_name = ''
-- WHERE middle_name IS NULL;

-- -- Step 4: Add NOT NULL constraints to all name fields (after setting default values)
-- ALTER TABLE registrations 
-- ALTER COLUMN first_name SET NOT NULL,
-- ALTER COLUMN middle_name SET NOT NULL,
-- ALTER COLUMN last_name SET NOT NULL;

-- -- Note: The name column is kept for backward compatibility during the transition
-- -- After verifying the migration works correctly, you can optionally drop it:
-- -- ALTER TABLE registrations DROP COLUMN IF EXISTS name;
