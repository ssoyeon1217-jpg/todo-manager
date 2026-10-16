import { WEEKDAYS } from "../constants";

/** Date → "YYYY-MM-DD" (로컬 시간 기준) */
export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfToday(): Date {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

/** "오늘 · 10월 16일 (금)" 형태의 제목 */
export function titleText(cur: Date, today: Date = startOfToday()): string {
  const diff = Math.round((cur.getTime() - today.getTime()) / 864e5);
  const base = `${cur.getMonth() + 1}월 ${cur.getDate()}일 (${WEEKDAYS[cur.getDay()]})`;
  if (diff === 0) return `오늘 · ${base}`;
  if (diff === 1) return `내일 · ${base}`;
  if (diff === -1) return `어제 · ${base}`;
  return base;
}
