import { describe, expect, it } from "vitest";
import {
  blankDay,
  editTask,
  insertAt,
  progressOf,
  reorder,
  sortTimedInPlace,
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
