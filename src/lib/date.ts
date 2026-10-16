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

/**
 * 월간 달력 칸을 만듭니다. 일요일부터 시작하며, 앞뒤 빈 칸은 null 입니다.
 * @param month0 0~11 (1월=0)
 */
export function buildMonthGrid(year: number, month0: number): (number | null)[] {
  const first = new Date(year, month0, 1).getDay();
  const days = new Date(year, month0 + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
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
