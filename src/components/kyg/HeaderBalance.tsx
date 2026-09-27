import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/auth";

export function HeaderBalance() {
  const { data: userId } = useQuery({
    queryKey: ["auth-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getMyProfile(userId as string),
    enabled: !!userId,
  });

  if (!profile) return null;

  return (
    <span className="whitespace-nowrap rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold text-gold">
      {(profile.balance ?? 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
    </span>
  );
}
