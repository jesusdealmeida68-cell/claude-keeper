import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  phone: z.string().trim().min(9).max(20),
  code: z.string().trim().regex(/^\d{6}$/),
  newPassword: z.string().min(6).max(72),
});

/** Valida e consome o código no servidor e define a nova senha. */
export const redeemPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: userId, error } = await supabaseAdmin.rpc("consume_password_reset", {
      _phone: data.phone,
      _code: data.code,
    });
    if (error) {
      console.error("[redeemPasswordReset]", error);
      throw new Error("server_error");
    }
    if (!userId) throw new Error("invalid_code");
    const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(userId as string, {
      password: data.newPassword,
    });
    if (upErr) {
      console.error("[redeemPasswordReset] update", upErr);
      throw new Error("server_error");
    }
    return { ok: true };
  });
