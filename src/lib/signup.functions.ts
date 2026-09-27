import { createServerFn } from "@tanstack/react-start";

function phoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, "")}@kyg.app`;
}

type AdminSignUpInput = {
  fullName: string;
  phone: string;
  password: string;
};

/**
 * Cria a conta diretamente com o email já confirmado (via API de admin do Supabase),
 * para não depender da confirmação por email — que nunca chegaria, pois o email
 * usado é sintético (baseado no número de telefone).
 */
export const adminSignUp = createServerFn({ method: "POST" })
  .validator((data: AdminSignUpInput) => data)
  .handler(async ({ data }) => {
    let supabaseAdmin: (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"];
    try {
      ({ supabaseAdmin } = await import("@/integrations/supabase/client.server"));
    } catch (e) {
      console.error("[adminSignUp] Falha ao criar cliente admin:", e);
      throw new Error(`config_error: ${e instanceof Error ? e.message : String(e)}`);
    }

    const email = phoneToEmail(data.phone);
    const digits = data.phone.replace(/\D/g, "");

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, phone: digits },
    });

    if (error) {
      console.error("[adminSignUp] Erro do Supabase ao criar utilizador:", error);
      const msg = (error.message ?? "").toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("database error creating new user") ||
        error.status === 422
      ) {
        throw new Error("already_registered");
      }
      throw new Error(`signup_failed: ${error.message ?? "erro desconhecido"}`);
    }

    return { email };
  });
