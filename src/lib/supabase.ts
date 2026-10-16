import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { KV } from "./kvStore";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** 키 값이 설정되어 있으면 서버 모드, 없으면 이 기기에만 저장하는 모드입니다. */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

/** 로그인한 사용자의 user_data 테이블을 KV 로 다룹니다. (user_id 는 서버가 로그인 정보로 채웁니다) */
export function supabaseKv(client: SupabaseClient): KV {
  return {
    async get(key) {
      const { data, error } = await client.from("user_data").select("value").eq("key", key).maybeSingle();
      if (error) throw error;
      return data ? (data.value as unknown) : null;
    },
    async set(key, value) {
      const { error } = await client
        .from("user_data")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
      if (error) throw error;
    },
    async list(prefix) {
      let q = client.from("user_data").select("key,value");
      if (prefix) q = q.like("key", `${prefix}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((r) => ({ key: r.key as string, value: r.value as unknown }));
    },
  };
}
