import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vkmrplowlefanykptocj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbXJwbG93bGVmYW55a3B0b2NqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzODk1MDIsImV4cCI6MjA1NDk2NTUwMn0.HN4g31yxlW5n0fvlelH_qTtVTcIXtOY5WoMl5wLy0ag'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)