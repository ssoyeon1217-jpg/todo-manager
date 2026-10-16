import { normalizeRoutines, normalizeSettings } from "./normalize";
import { summarizeDay } from "./tasks";
import type { DayDoc, DaySummary, Storage, Task } from "../types";

/** 키-값 저장소의 최소 모양. 서버(Supabase)나 테스트용 메모리가 이 모양을 맞춥니다. */
export interface KV {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown): Promise<void>;
  /** key 가 prefix 로 시작하는 항목 모두 */
  list(prefix: string): Promise<{ key: string; value: unknown }[]>;
}

/**
 * KV 위에 Storage 를 만듭니다.
 * - 읽기 실패는 빈 값으로 처리하고, 저장 실패는 onError 로 알려 줍니다.
 */
export function createKvStore(kv: KV, onError: (e: unknown) => void = () => {}): Storage {
  const save = async (key: string, value: unknown) => {
    try {
      await kv.set(key, value);
    } catch (e) {
      onError(e);
    }
  };
  const load = async (key: string): Promise<unknown | null> => {
    try {
      return await kv.get(key);
    } catch (e) {
      onError(e);
      return null;
    }
  };

  return {
    async getDay(ymd) {
      return (await load(`day:${ymd}`)) as DayDoc | null;
    },
    saveDay: (ymd, doc) => save(`day:${ymd}`, doc),
    async getMonthSummary(ym) {
      const out: Record<string, DaySummary> = {};
      try {
        for (const row of await kv.list(`day:${ym}-`)) {
          const s = summarizeDay(row.value as DayDoc);
          if (s.total > 0) out[row.key.slice("day:".length)] = s;
        }
      } catch (e) {
        onError(e);
      }
      return out;
    },
    async getSomeday() {
      const v = await load("someday");
      return Array.isArray(v) ? (v as Task[]) : [];
    },
    saveSomeday: (items) => save("someday", items),
    async getRoutines() {
      return normalizeRoutines(await load("routines"));
    },
    saveRoutines: (items) => save("routines", items),
    async getSettings() {
      return normalizeSettings(await load("settings"));
    },
    saveSettings: (settings) => save("settings", settings),
  };
}

/** 서버가 비어 있을 때, 이 기기(localStorage)에 있던 기록을 한 번 올립니다. 올린 개수를 돌려줍니다. */
export async function migrateIfEmpty(
  remote: KV,
  local: { key: string; value: unknown }[],
): Promise<number> {
  if (local.length === 0) return 0;
  const existing = await remote.list("");
  if (existing.length > 0) return 0;
  for (const row of local) await remote.set(row.key, row.value);
  return local.length;
}
