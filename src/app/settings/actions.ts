"use server";

import { encrypt, decrypt } from "@/lib/encryption";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function saveEncryptedConfig(url: string, key: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        }
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const encryptedUrl = url ? encrypt(url) : "";
    const encryptedKey = key ? encrypt(key) : "";

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        encrypted_target_url: encryptedUrl,
        encrypted_target_key: encryptedKey,
        target_url_last_chars: url ? url.slice(-4) : "",
      }
    });

    if (updateError) throw updateError;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkConfigurationStatus() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const hasUrl = !!user.user_metadata?.encrypted_target_url;
    const hasKey = !!user.user_metadata?.encrypted_target_key;
    
    return hasUrl && hasKey;
  } catch {
    return false;
  }
}
