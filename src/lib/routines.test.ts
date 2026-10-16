import { describe, expect, it } from "vitest";
import { normalizeRoutines, normalizeSettings } from "./normalize";
import { applyRoutines } from "./routines";
import { blankDay } from "./tasks";
import type { Routine } from "../types";

const r = (text: string, over: Partial<Routine> = {}): Routine => ({
  id: text,
  text,
  section: "home",
  days: [],
  ...over,
});

describe("applyRoutines", () => {
  it("요일이 맞는 루틴을 지정한 칸에 넣는다", () => {
    const { doc, added } = applyRoutines(blankDay(), [r("필라테스", { days: [3, 5] }), r("영어")], 3);
    expect(added).toBe(2);
    expect(doc.sections.home?.map((t) => t.text)).toEqual(["필라테스", "영어"]);
  });

  it("다른 요일 루틴은 넣지 않고, 요일을 비우면 매일 넣는다", () => {
    const { added } = applyRoutines(blankDay(), [r("필라테스", { days: [3, 5] }), r("영어")], 1);
    expect(added).toBe(1);
  });

  it("같은 칸에 같은 이름이 있으면 다시 넣지 않는다", () => {
    const first = applyRoutines(blankDay(), [r("영어")], 1);
    const second = applyRoutines(first.doc, [r("영어")], 1);
    expect(second.added).toBe(0);
    expect(second.doc).toBe(first.doc);
  });

  it("쉬는 날엔 모두 '오늘 할 일' 칸으로 들어간다", () => {
    const { doc } = applyRoutines(blankDay("rest"), [r("영어", { section: "go" })], 0);
    expect(doc.sections.rest?.map((t) => t.text)).toEqual(["영어"]);
    expect(doc.sections.go).toBeUndefined();
  });

  it("'쉬는 날엔 넣지 않기' 루틴은 쉬는 날에 건너뛴다", () => {
    const { added } = applyRoutines(blankDay("rest"), [r("출근 준비", { workOnly: true })], 0);
    expect(added).toBe(0);
  });

  it("이름이 비어 있으면 건너뛴다", () => {
    expect(applyRoutines(blankDay(), [r("  ")], 1).added).toBe(0);
  });

  it("원본 문서를 바꾸지 않는다", () => {
    const base = blankDay();
    applyRoutines(base, [r("영어")], 1);
    expect(base.sections).toEqual({});
  });
});

describe("normalizeSettings", () => {
  it("값이 없으면 기본값(일·토 쉼, 자동 넣기 켬)", () => {
    expect(normalizeSettings(null)).toEqual({ restDays: [0, 6], autoRoutine: true });
  });

  it("잘못된 요일은 걸러내고 정렬·중복 제거한다", () => {
    expect(normalizeSettings({ restDays: [6, 0, 9, "x", 6], autoRoutine: false })).toEqual({
      restDays: [0, 6],
      autoRoutine: false,
    });
  });

  it("쉬는 요일을 모두 비워도 그대로 둔다", () => {
    expect(normalizeSettings({ restDays: [] }).restDays).toEqual([]);
  });
});

describe("normalizeRoutines", () => {
  it("배열이 아니면 빈 목록", () => {
    expect(normalizeRoutines("oops")).toEqual([]);
  });

  it("빠진 값을 채우고 잘못된 칸은 일과후로 돌린다", () => {
    const [x] = normalizeRoutines([{ text: "영어", section: "weird", days: [1, 9] }]);
    expect(x.section).toBe("home");
    expect(x.days).toEqual([1]);
    expect(typeof x.id).toBe("string");
  });
});
