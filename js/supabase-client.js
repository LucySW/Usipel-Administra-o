// -------------------------------------------------------------
// SUPABASE CLIENT INITIALIZATION
// Substitua URL e KEY pelos valores do seu Dashboard Supabase.
// -------------------------------------------------------------
const SUPABASE_URL = "https://uqhgidwpmeaitrblohnt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxaGdpZHdwbWVhaXRyYmxvaG50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NDE4NzUsImV4cCI6MjA5MDIxNzg3NX0.VKQYPuR38DP-gI3JxgNucaCNMiFQJ4lwA0ZARhUtq0g";

supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variável para armazenar a sessão do usuário
let session = null;
