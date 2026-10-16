import type { DayDoc, SectionKey, Task } from "../types";

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function blankDay(mode: DayDoc["mode"] = "work"): DayDoc {
  return { mode, sections: {} };
}

export function makeTask(text: string, time?: string): Task {
  return { id: newId(), text: text.trim(), done: false, ...(time ? { time } : {}) };
}

/**
 * 시간이 있는 일끼리만 시간순으로 정렬하고,
 * 시간이 없는 일은 입력한 자리를 그대로 유지합니다.
 */
export function sortTimedInPlace(tasks: Task[]): Task[] {
  const timed = tasks.filter((t) => t.time).sort((a, b) => a.time!.localeCompare(b.time!));
  let i = 0;
  return tasks.map((t) => (t.time ? timed[i++] : t));
}

/** 한 칸 안의 일 목록을 바꾼 새 DayDoc 반환 (불변 업데이트) */
export function withSection(
  doc: DayDoc,
  key: Exclude<SectionKey, "someday">,
  tasks: Task[],
): DayDoc {
  return { ...doc, sections: { ...doc.sections, [key]: tasks } };
}

export function progressOf(tasks: Task[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.done).length, total: tasks.length };
}
