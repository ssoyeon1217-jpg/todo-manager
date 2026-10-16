import { describe, expect, it } from "vitest";
import { addDays, buildMonthGrid, daysFromToday, titleParts, titleText, toYmd } from "./date";

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

describe("titleParts / titleText", () => {
  const today = new Date(2026, 9, 16); // 2026-10-16 (금)

  it("오늘·내일·어제는 상대 표현을 붙인다", () => {
    expect(titleParts(today, today)).toEqual({ relative: "오늘", date: "10월 16일 (금)" });
    expect(titleParts(new Date(2026, 9, 17), today).relative).toBe("내일");
    expect(titleParts(new Date(2026, 9, 15), today).relative).toBe("어제");
  });

  it("그 밖의 날은 상대 표현이 없다", () => {
    expect(titleParts(new Date(2026, 9, 20), today)).toEqual({ relative: null, date: "10월 20일 (화)" });
  });

  it("titleText 는 둘을 합친다", () => {
    expect(titleText(today, today)).toBe("오늘 · 10월 16일 (금)");
    expect(titleText(new Date(2026, 9, 20), today)).toBe("10월 20일 (화)");
  });
});

describe("daysFromToday", () => {
  it("어제는 -1, 내일은 1", () => {
    const today = new Date(2026, 9, 16);
    expect(daysFromToday(new Date(2026, 9, 15), today)).toBe(-1);
    expect(daysFromToday(today, today)).toBe(0);
    expect(daysFromToday(new Date(2026, 9, 17), today)).toBe(1);
  });
});
