/** 하루의 구분(칸). 근무일엔 4칸, 쉬는 날엔 '오늘 할 일' 1칸 + 언젠가 */
export type SectionKey = "rest" | "go" | "school" | "back" | "home" | "someday";

/** 세부 항목 표시: ○ 했음 / △ 하다 말음 / ✕ 못함 (공부 항목) */
export type Mark = "o" | "t" | "x" | null;

export interface SubItem {
  id: string;
  text: string;
  mark: Mark;
}

export interface Task {
  id: string;
  text: string;
  done: boolean;
  /** "HH:mm" — 시간이 있는 일끼리만 시간순 정렬 */
  time?: string;
  subs?: SubItem[];
}

/** 하루치 문서. 입력한 순서가 곧 할 순서 */
export interface DayDoc {
  mode: "work" | "rest";
  sections: Partial<Record<Exclude<SectionKey, "someday">, Task[]>>;
}

/** 반복 할 일(루틴) */
export interface Routine {
  id: string;
  text: string;
  section: SectionKey;
  /** 반복 요일(일=0 … 토=6). 비어 있으면 매일 */
  days: number[];
}

/** 저장소 추상화 — 지금은 localStorage, 이후 서버(DB)로 교체 가능 */
export interface Storage {
  getDay(ymd: string): Promise<DayDoc | null>;
  saveDay(ymd: string, doc: DayDoc): Promise<void>;
  getSomeday(): Promise<Task[]>;
  saveSomeday(items: Task[]): Promise<void>;
  getRoutines(): Promise<Routine[]>;
  saveRoutines(items: Routine[]): Promise<void>;
}
