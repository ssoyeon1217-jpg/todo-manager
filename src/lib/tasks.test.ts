import { describe, expect, it } from "vitest";
import { blankDay, editTask, sortTimedInPlace, progressOf } from "./tasks";
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
