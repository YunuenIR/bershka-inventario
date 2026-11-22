
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
console.log("URL:", supabaseUrl);
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("URL de Supabase:", supabaseUrl);

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
