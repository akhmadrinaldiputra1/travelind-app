import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://sxujxemtytemsfvwqdky.supabase.co";
const supabaseAnonKey = "sb_publishable_7EnmDwy88UxCyzb56p1QcA_9F1yHNnk"; // Gunakan env variabel di produksi jika diperlukan

export const supabase = createClient(supabaseUrl, supabaseAnonKey);