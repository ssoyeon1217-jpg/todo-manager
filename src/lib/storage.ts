import { normalizeRoutines, normalizeSettings } from "./normalize";
import { summarizeDay } from "./tasks";
import type { DayDoc, DaySummary, Storage, Task } from "../types";

const PREFIX = "todo-manager:";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* 저장 공간이 없거나 막힌 환경: 조용히 무시 */
  }
}

/** 브라우저(localStorage) 저장소. 서버 연동 시 같은 Storage 인터페이스로 교체합니다. */
export const localStorageStore: Storage = {
  async getDay(ymd) {
    return read<DayDoc | null>(`day:${ymd}`, null);
  },
  async saveDay(ymd, doc) {
    write(`day:${ymd}`, doc);
  },
  async getMonthSummary(ym) {
    const out: Record<string, DaySummary> = {};
    try {
      const dayPrefix = `${PREFIX}day:`;
      const monthPrefix = `${dayPrefix}${ym}-`;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(monthPrefix)) continue;
        const ymd = key.slice(dayPrefix.length);
        const doc = read<DayDoc | null>(`day:${ymd}`, null);
        if (!doc) continue;
        const s = summarizeDay(doc);
        if (s.total > 0) out[ymd] = s;
      }
    } catch {
      /* localStorage를 쓸 수 없는 환경: 빈 요약 */
    }
    return out;
  },
  async getSomeday() {
    return read<Task[]>("someday", []);
  },
  async saveSomeday(items) {
    write("someday", items);
  },
  async getRoutines() {
    return normalizeRoutines(read<unknown>("routines", []));
  },
  async saveRoutines(items) {
    write("routines", items);
  },
  async getSettings() {
    return normalizeSettings(read<unknown>("settings", null));
  },
  async saveSettings(settings) {
    write("settings", settings);
  },
};

/** 이 기기(localStorage)에 저장된 모든 기록을 {key, value} 로 읽습니다. (서버로 옮길 때 사용) */
export function readLocalRows(): { key: string; value: unknown }[] {
  const rows: { key: string; value: unknown }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const full = localStorage.key(i);
      if (!full || !full.startsWith(PREFIX)) continue;
      const key = full.slice(PREFIX.length);
      if (key !== "someday" && key !== "routines" && key !== "settings" && !key.startsWith("day:")) continue;
      const raw = localStorage.getItem(full);
      if (raw) rows.push({ key, value: JSON.parse(raw) as unknown });
    }
  } catch {
    /* 읽을 수 없으면 옮길 것이 없는 것으로 */
  }
  return rows;
}
