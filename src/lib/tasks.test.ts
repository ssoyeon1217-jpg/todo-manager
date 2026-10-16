import { describe, expect, it } from "vitest";
import { sortTimedInPlace, progressOf } from "./tasks";
import type { Task } from "../types";

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
