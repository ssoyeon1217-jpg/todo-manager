import { describe, expect, it } from "vitest";
import { createKvStore, migrateIfEmpty, type KV } from "./kvStore";
import { blankDay } from "./tasks";

function memoryKv(): KV & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  return {
    data,
    async get(k) {
      return data.has(k) ? data.get(k)! : null;
    },
    async set(k, v) {
      data.set(k, v);
    },
    async list(prefix) {
      return [...data].filter(([k]) => k.startsWith(prefix)).map(([key, value]) => ({ key, value }));
    },
  };
}

describe("createKvStore", () => {
  it("하루 문서를 저장하고 다시 읽는다", async () => {
    const store = createKvStore(memoryKv());
    expect(await store.getDay("2026-10-16")).toBe(null);
    const doc = { ...blankDay(), sections: { school: [{ id: "a", text: "수업", done: true }] } };
    await store.saveDay("2026-10-16", doc);
    expect(await store.getDay("2026-10-16")).toEqual(doc);
  });

  it("월 요약은 그 달의 날짜만, 할 일이 있는 날만 담는다", async () => {
    const kv = memoryKv();
    const store = createKvStore(kv);
    await store.saveDay("2026-10-16", { ...blankDay(), sections: { school: [{ id: "a", text: "x", done: true }] } });
    await store.saveDay("2026-10-17", blankDay());
    await store.saveDay("2026-11-01", { ...blankDay(), sections: { school: [{ id: "b", text: "y", done: false }] } });
    expect(await store.getMonthSummary("2026-10")).toEqual({ "2026-10-16": { done: 1, total: 1 } });
  });

  it("저장된 값이 없으면 설정·루틴·언젠가는 기본값", async () => {
    const store = createKvStore(memoryKv());
    expect(await store.getSomeday()).toEqual([]);
    expect(await store.getRoutines()).toEqual([]);
    expect(await store.getSettings()).toEqual({ restDays: [0, 6], autoRoutine: true });
  });

  it("저장이 실패하면 onError 로 알린다 (예외를 던지지 않는다)", async () => {
    const kv = memoryKv();
    kv.set = async () => {
      throw new Error("offline");
    };
    const errors: unknown[] = [];
    const store = createKvStore(kv, (e) => errors.push(e));
    await store.saveSomeday([]);
    expect(errors.length).toBe(1);
  });

  it("읽기가 실패하면 빈 값으로 처리한다", async () => {
    const kv = memoryKv();
    kv.get = async () => {
      throw new Error("offline");
    };
    const store = createKvStore(kv);
    expect(await store.getDay("2026-10-16")).toBe(null);
  });
});

describe("migrateIfEmpty", () => {
  const local = [{ key: "someday", value: [] }, { key: "day:2026-10-16", value: blankDay() }];

  it("서버가 비어 있으면 이 기기의 기록을 올린다", async () => {
    const kv = memoryKv();
    expect(await migrateIfEmpty(kv, local)).toBe(2);
    expect(kv.data.size).toBe(2);
  });

  it("서버에 이미 기록이 있으면 아무것도 덮어쓰지 않는다", async () => {
    const kv = memoryKv();
    kv.data.set("settings", {});
    expect(await migrateIfEmpty(kv, local)).toBe(0);
    expect(kv.data.size).toBe(1);
  });

  it("올릴 기록이 없으면 0", async () => {
    expect(await migrateIfEmpty(memoryKv(), [])).toBe(0);
  });
});
