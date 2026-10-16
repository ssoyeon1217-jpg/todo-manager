import type { SectionKey, Settings } from "./types";

export interface SectionDef {
  key: SectionKey;
  name: string;
  /** CSS 변수 이름(색 점) */
  dot: string;
}

export const REST_SECTION: SectionDef = { key: "rest", name: "오늘 할 일", dot: "--c6" };

export const WORK_SECTIONS: SectionDef[] = [
  { key: "go", name: "일과전", dot: "--c1" },
  { key: "school", name: "일과중", dot: "--c2" },
  { key: "back", name: "이동중", dot: "--c3" },
  { key: "home", name: "일과후", dot: "--c4" },
];

export const SOMEDAY_SECTION: SectionDef = { key: "someday", name: "언젠가", dot: "--c5" };

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 기본 쉬는 요일: 일, 토 */
export const DEFAULT_REST_DAYS = [0, 6];

export const DEFAULT_SETTINGS: Settings = {
  restDays: [...DEFAULT_REST_DAYS],
  autoRoutine: true,
};
