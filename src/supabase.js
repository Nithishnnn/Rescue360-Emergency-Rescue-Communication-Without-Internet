import { createClient } from '@supabase/supabase-js';

// Supabase project credentials provided by user
const SUPABASE_URL = 'https://xhhmwajfrxyrprqedubj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaG13YWpmcnh5cnBycWVkdWJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTgwMzYsImV4cCI6MjA5Mzk3NDAzNn0.wVOiW9ZNDqyTArajUt2WDXDUINd6e23Jxg7lQrYZRfU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
