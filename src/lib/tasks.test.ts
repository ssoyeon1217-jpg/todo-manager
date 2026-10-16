import { describe, expect, it } from "vitest";
import {
  blankDay,
  cycleSubMark,
  editTask,
  insertAt,
  isStudy,
  makeSub,
  nextMark,
  progressOf,
  reorder,
  sortTimedInPlace,
  subProgress,
  summarizeDay,
} from "./tasks";
import type { DayDoc, Task } from "../types";

const t = (text: string, time?: string, done = false): Task => ({
  id: text,
  text,
  done,
  ...(time ? { time } : {}),
});

describe("sortTimedInPlace", () => {
  it("시간 있는 일끼리만 시간순 정렬하고 나머지는 자리를 유지한다", () => {
    const out = sortTimedInPlace([t("a", "15:00"), t("b"), t("c", "09:00"), t("d")]);
    expect(out.map((x) => x.text)).toEqual(["c", "b", "a", "d"]);
  });
});

describe("progressOf", () => {
  it("완료 개수를 센다", () => {
    expect(progressOf([t("a", undefined, true), t("b")])).toEqual({ done: 1, total: 2 });
  });
});

describe("editTask", () => {
  const base = (): DayDoc => ({
    ...blankDay(),
    sections: { school: [t("a", "10:00"), t("b")], home: [t("c")] },
  });

  it("글을 바꿔도 자리를 유지한다", () => {
    const doc = editTask(base(), "school", "b", { text: " 새 글 ", time: "", section: "school" });
    expect(doc.sections.school?.map((x) => x.text)).toEqual(["a", "새 글"]);
  });

  it("시간을 지우면 시간 없는 일이 된다", () => {
    const doc = editTask(base(), "school", "a", { text: "a", time: "", section: "school" });
    expect(doc.sections.school?.[0].time).toBeUndefined();
  });

  it("시간을 바꾸면 시간 있는 일끼리 다시 정렬한다", () => {
    const start: DayDoc = { ...blankDay(), sections: { school: [t("a", "10:00"), t("b", "11:00")] } };
    const doc = editTask(start, "school", "a", { text: "a", time: "12:00", section: "school" });
    expect(doc.sections.school?.map((x) => x.text)).toEqual(["b", "a"]);
  });

  it("다른 칸으로 옮기면 그 칸의 끝에 붙는다", () => {
    const doc = editTask(base(), "school", "b", { text: "b", time: "", section: "home" });
    expect(doc.sections.school?.map((x) => x.text)).toEqual(["a"]);
    expect(doc.sections.home?.map((x) => x.text)).toEqual(["c", "b"]);
  });

  it("내용이 비어 있으면 바꾸지 않는다", () => {
    const start = base();
    expect(editTask(start, "school", "a", { text: "  ", time: "", section: "school" })).toBe(start);
  });
});

describe("reorder", () => {
  it("항목을 원하는 자리로 옮긴다", () => {
    expect(reorder(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(reorder(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("범위를 벗어나거나 같은 자리면 그대로 둔다", () => {
    const list = ["a", "b"];
    expect(reorder(list, 0, 0)).toBe(list);
    expect(reorder(list, 5, 0)).toBe(list);
  });
});

describe("insertAt", () => {
  it("지정한 자리에 끼워 넣고, 범위를 벗어나면 보정한다", () => {
    expect(insertAt(["a", "c"], 1, "b")).toEqual(["a", "b", "c"]);
    expect(insertAt(["a"], 9, "z")).toEqual(["a", "z"]);
    expect(insertAt(["a"], -3, "z")).toEqual(["z", "a"]);
  });
});

describe("summarizeDay", () => {
  it("모든 칸의 완료/전체 개수를 센다", () => {
    const doc: DayDoc = {
      ...blankDay(),
      sections: { go: [t("a", undefined, true)], home: [t("b"), t("c", undefined, true)] },
    };
    expect(summarizeDay(doc)).toEqual({ done: 2, total: 3 });
  });

  it("비어 있으면 0/0", () => {
    expect(summarizeDay(blankDay())).toEqual({ done: 0, total: 0 });
  });
});

describe("isStudy", () => {
  it("'공부'로 시작하는 항목만 공부로 본다", () => {
    expect(isStudy({ text: "공부" })).toBe(true);
    expect(isStudy({ text: " 공부 (임용)" })).toBe(true);
    expect(isStudy({ text: "독서" })).toBe(false);
    expect(isStudy({ text: "오늘 공부" })).toBe(false);
  });
});

describe("nextMark", () => {
  it("공부 항목은 없음 → ○ → △ → ✕ → 없음", () => {
    expect(nextMark(null, true)).toBe("o");
    expect(nextMark("o", true)).toBe("t");
    expect(nextMark("t", true)).toBe("x");
    expect(nextMark("x", true)).toBe(null);
  });

  it("그 밖의 항목은 없음 → ○ → ✕ → 없음", () => {
    expect(nextMark(null, false)).toBe("o");
    expect(nextMark("o", false)).toBe("x");
    expect(nextMark("t", false)).toBe("x");
    expect(nextMark("x", false)).toBe(null);
  });
});

describe("cycleSubMark / subProgress", () => {
  const withSubs = (text: string): DayDoc => ({
    ...blankDay(),
    sections: {
      school: [{ id: "p", text, done: false, subs: [{ ...makeSub("a"), id: "s1" }, { ...makeSub("b"), id: "s2" }] }],
    },
  });

  it("누른 세부 항목만 다음 표시로 바뀐다", () => {
    const doc = cycleSubMark(withSubs("공부"), "school", "p", "s1");
    expect(doc.sections.school?.[0].subs?.map((s) => s.mark)).toEqual(["o", null]);
    const again = cycleSubMark(doc, "school", "p", "s1");
    expect(again.sections.school?.[0].subs?.[0].mark).toBe("t");
  });

  it("공부가 아니면 ○ 다음이 ✕", () => {
    const doc = cycleSubMark(cycleSubMark(withSubs("독서"), "school", "p", "s2"), "school", "p", "s2");
    expect(doc.sections.school?.[0].subs?.[1].mark).toBe("x");
  });

  it("○ 개수와 전체 개수를 센다", () => {
    const doc = cycleSubMark(withSubs("공부"), "school", "p", "s1");
    expect(subProgress(doc.sections.school![0])).toEqual({ done: 1, total: 2 });
    expect(subProgress({ id: "x", text: "x", done: false })).toEqual({ done: 0, total: 0 });
  });
});

describe("editTask 세부 항목", () => {
  const start = (): DayDoc => ({
    ...blankDay(),
    sections: { school: [{ id: "p", text: "공부", done: false, subs: [{ ...makeSub("a"), id: "s1", mark: "o" }] }] },
  });

  it("subs를 생략하면 세부 항목과 표시를 그대로 둔다", () => {
    const doc = editTask(start(), "school", "p", { text: "공부 2", time: "", section: "school" });
    expect(doc.sections.school?.[0].subs?.[0].mark).toBe("o");
  });

  it("subs를 주면 바꾸고, 빈 글은 버린다", () => {
    const doc = editTask(start(), "school", "p", {
      text: "공부",
      time: "",
      section: "school",
      subs: [{ ...makeSub("a"), id: "s1", mark: "o" }, { ...makeSub("  "), id: "s2" }, makeSub(" 새 항목 ")],
    });
    expect(doc.sections.school?.[0].subs?.map((s) => s.text)).toEqual(["a", "새 항목"]);
  });

  it("subs를 모두 지우면 필드 자체가 사라진다", () => {
    const doc = editTask(start(), "school", "p", { text: "공부", time: "", section: "school", subs: [] });
    expect(doc.sections.school?.[0].subs).toBeUndefined();
  });

  it("다른 칸으로 옮겨도 세부 항목이 따라간다", () => {
    const doc = editTask(start(), "school", "p", { text: "공부", time: "", section: "home" });
    expect(doc.sections.home?.[0].subs?.length).toBe(1);
  });
});
