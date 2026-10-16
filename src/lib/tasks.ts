import type { DayDoc, DaySummary, Mark, SectionKey, SubItem, Task } from "../types";

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

export function makeSub(text: string): SubItem {
  return { id: newId(), text: text.trim(), mark: null };
}

/** '공부'로 시작하는 항목의 세부 내용은 ○ △ ✕ 로, 그 밖의 항목은 ○ ✕ 로 표시합니다. */
export function isStudy(task: Pick<Task, "text">): boolean {
  return task.text.trim().startsWith("공부");
}

/**
 * 표시를 누를 때마다 바뀌는 순서.
 * 공부: 없음 → ○ → △ → ✕ → 없음 / 그 외: 없음 → ○ → ✕ → 없음
 */
export function nextMark(mark: Mark, study: boolean): Mark {
  if (mark === null) return "o";
  if (mark === "o") return study ? "t" : "x";
  if (mark === "t") return "x";
  return null;
}

/** 한 항목의 세부 내용 중 ○ 로 표시된 개수 / 전체 개수 */
export function subProgress(task: Task): { done: number; total: number } {
  const subs = task.subs ?? [];
  return { done: subs.filter((s) => s.mark === "o").length, total: subs.length };
}

/** 세부 항목 하나의 표시를 다음 단계로 바꾼 새 DayDoc */
export function cycleSubMark(
  doc: DayDoc,
  key: Exclude<SectionKey, "someday">,
  taskId: string,
  subId: string,
): DayDoc {
  const list = (doc.sections[key] ?? []).map((t) => {
    if (t.id !== taskId || !t.subs) return t;
    const study = isStudy(t);
    return {
      ...t,
      subs: t.subs.map((s) => (s.id === subId ? { ...s, mark: nextMark(s.mark, study) } : s)),
    };
  });
  return withSection(doc, key, list);
}

export interface TaskEdit {
  text: string;
  /** 빈 문자열이면 시간 없음 */
  time: string;
  section: Exclude<SectionKey, "someday">;
  /** 주어지면 세부 항목을 이 목록으로 바꿈 (빈 글은 버림). 생략하면 그대로 둠 */
  subs?: SubItem[];
}

/**
 * 항목의 글·시간·칸을 수정한 새 DayDoc을 반환합니다.
 * - 내용이 비어 있거나 항목을 찾지 못하면 원본을 그대로 돌려줍니다.
 * - 같은 칸이면 자리를 유지하고, 다른 칸으로 옮기면 그 칸의 맨 끝에 붙습니다.
 * - 시간이 있는 일끼리만 시간순으로 다시 정렬합니다.
 */
export function editTask(
  doc: DayDoc,
  from: Exclude<SectionKey, "someday">,
  id: string,
  edit: TaskEdit,
): DayDoc {
  const text = edit.text.trim();
  const source = doc.sections[from] ?? [];
  const original = source.find((t) => t.id === id);
  if (!text || !original) return doc;

  const { time: _oldTime, subs: oldSubs, ...rest } = original;
  const subs =
    edit.subs === undefined
      ? oldSubs
      : edit.subs.map((s) => ({ ...s, text: s.text.trim() })).filter((s) => s.text);
  const updated: Task = {
    ...rest,
    text,
    ...(edit.time ? { time: edit.time } : {}),
    ...(subs && subs.length ? { subs } : {}),
  };

  if (edit.section === from) {
    const list = source.map((t) => (t.id === id ? updated : t));
    return withSection(doc, from, sortTimedInPlace(list));
  }

  const without = source.filter((t) => t.id !== id);
  const target = [...(doc.sections[edit.section] ?? []), updated];
  return withSection(withSection(doc, from, without), edit.section, sortTimedInPlace(target));
}

/** from 자리의 항목을 to 자리로 옮긴 새 배열 (범위를 벗어나면 원본 그대로) */
export function reorder<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** index 자리에 항목을 끼워 넣은 새 배열 (index가 범위를 벗어나면 끝/처음으로 보정) */
export function insertAt<T>(list: T[], index: number, item: T): T[] {
  const i = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, i), item, ...list.slice(i)];
}

/** 하루 문서 전체(모든 칸)의 완료/전체 개수 */
export function summarizeDay(doc: DayDoc): DaySummary {
  const all = Object.values(doc.sections).flatMap((list) => list ?? []);
  return progressOf(all);
}

export function progressOf(tasks: Task[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.done).length, total: tasks.length };
}
