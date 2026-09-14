import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Este cliente usa la clave "service_role" de Supabase, que puede saltarse
 * las reglas de seguridad (RLS) de las tablas. Por eso NUNCA debe importarse
 * desde un archivo "use client" ni desde nada que se ejecute en el navegador
 * — solo desde rutas dentro de app/api/**, que corren en el servidor.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
