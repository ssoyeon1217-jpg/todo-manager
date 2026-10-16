import { describe, expect, it } from "vitest";
import { addDays, buildMonthGrid, toYmd } from "./date";

describe("toYmd", () => {
  it("0을 채운 YYYY-MM-DD 로 바꾼다", () => {
    expect(toYmd(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("월을 넘어가도 계산한다", () => {
    expect(toYmd(addDays(new Date(2026, 9, 31), 1))).toBe("2026-11-01");
  });
});

describe("buildMonthGrid", () => {
  it("2026년 10월은 목요일(4번째 칸)에서 시작하고 31일까지, 7의 배수 길이다", () => {
    const g = buildMonthGrid(2026, 9);
    expect(g.length % 7).toBe(0);
    expect(g.slice(0, 4)).toEqual([null, null, null, null]);
    expect(g[4]).toBe(1);
    expect(g.filter((x) => x !== null).length).toBe(31);
  });

  it("2월(윤년)도 날짜 수가 맞다", () => {
    expect(buildMonthGrid(2028, 1).filter((x) => x !== null).length).toBe(29);
  });
});
