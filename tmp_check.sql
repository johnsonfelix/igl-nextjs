-- Check existing columns in MeetingRequest table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'MeetingRequest' 
ORDER BY ordinal_position;
