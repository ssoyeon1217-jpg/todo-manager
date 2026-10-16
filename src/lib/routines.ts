import { makeTask, sortTimedInPlace } from "./tasks";
import type { DayDoc, Routine, WorkSectionKey } from "../types";

const WORK_KEYS: WorkSectionKey[] = ["go", "school", "back", "home"];

/**
 * 그 요일에 해당하는 루틴을 하루 문서에 넣습니다.
 * - 이름이 비었거나 다른 요일 루틴, 쉬는 날에 넣지 않기로 한 루틴은 건너뜁니다.
 * - 쉬는 날엔 모두 '오늘 할 일' 칸으로 들어갑니다.
 * - 같은 칸에 같은 이름이 이미 있으면 다시 넣지 않습니다.
 * @param weekday 일=0 … 토=6
 */
export function applyRoutines(
  doc: DayDoc,
  routines: Routine[],
  weekday: number,
): { doc: DayDoc; added: number } {
  const sections = { ...doc.sections };
  let added = 0;

  for (const r of routines) {
    const text = r.text.trim();
    if (!text) continue;
    if (r.days.length > 0 && !r.days.includes(weekday)) continue;
    if (r.workOnly && doc.mode === "rest") continue;

    const key = doc.mode === "rest" ? "rest" : WORK_KEYS.includes(r.section) ? r.section : "home";
    const list = sections[key] ?? [];
    if (list.some((t) => t.text === text)) continue;

    sections[key] = sortTimedInPlace([...list, makeTask(text)]);
    added++;
  }

  return { doc: added > 0 ? { ...doc, sections } : doc, added };
}
