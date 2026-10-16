import type { DayDoc, Routine, Storage, Task } from "../types";

const PREFIX = "todo-manager:";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* 저장 공간이 없거나 막힌 환경: 조용히 무시 */
  }
}

/** 브라우저(localStorage) 저장소. 서버 연동 시 같은 Storage 인터페이스로 교체합니다. */
export const localStorageStore: Storage = {
  async getDay(ymd) {
    return read<DayDoc | null>(`day:${ymd}`, null);
  },
  async saveDay(ymd, doc) {
    write(`day:${ymd}`, doc);
  },
  async getSomeday() {
    return read<Task[]>("someday", []);
  },
  async saveSomeday(items) {
    write("someday", items);
  },
  async getRoutines() {
    return read<Routine[]>("routines", []);
  },
  async saveRoutines(items) {
    write("routines", items);
  },
};
