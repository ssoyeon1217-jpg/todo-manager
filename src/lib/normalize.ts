import { DEFAULT_SETTINGS } from "../constants";
import { newId } from "./tasks";
import type { Routine, Settings, WorkSectionKey } from "../types";

const WORK_KEYS: WorkSectionKey[] = ["go", "school", "back", "home"];

function validDays(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const days = raw.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6);
  return [...new Set(days)].sort((a, b) => a - b);
}

/** 저장된 설정을 읽을 때 빠진 값·잘못된 값을 기본값으로 채웁니다. */
export function normalizeSettings(raw: unknown): Settings {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    restDays: Array.isArray(o.restDays) ? validDays(o.restDays) : [...DEFAULT_SETTINGS.restDays],
    autoRoutine: o.autoRoutine !== false,
  };
}

/** 저장된 루틴 목록을 읽을 때 잘못된 항목을 걸러내고 빠진 값을 채웁니다. */
export function normalizeRoutines(raw: unknown): Routine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
    .map((r) => ({
      id: typeof r.id === "string" && r.id ? r.id : newId(),
      text: typeof r.text === "string" ? r.text : "",
      section: WORK_KEYS.includes(r.section as WorkSectionKey) ? (r.section as WorkSectionKey) : "home",
      days: validDays(r.days),
      ...(r.workOnly === true ? { workOnly: true } : {}),
    }));
}
