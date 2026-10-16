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

/** 근무일의 시간대 칸 (루틴은 이 중 하나에 들어감) */
export type WorkSectionKey = "go" | "school" | "back" | "home";

/** 하루치 문서. 입력한 순서가 곧 할 순서 */
export interface DayDoc {
  mode: "work" | "rest";
  sections: Partial<Record<Exclude<SectionKey, "someday">, Task[]>>;
  /** 루틴을 이미 넣은 날. 지운 루틴이 자동으로 다시 생기지 않게 표시 */
  routinesDone?: boolean;
}

/** 반복 할 일(루틴) */
export interface Routine {
  id: string;
  text: string;
  /** 근무일에 들어갈 칸 (쉬는 날엔 모두 '오늘 할 일') */
  section: WorkSectionKey;
  /** 반복 요일(일=0 … 토=6). 비어 있으면 매일 */
  days: number[];
  /** true 면 쉬는 날엔 넣지 않음 */
  workOnly?: boolean;
}

/** 앱 설정 */
export interface Settings {
  /** 쉬는 요일(일=0 … 토=6) */
  restDays: number[];
  /** 오늘·내일을 처음 열 때 루틴을 자동으로 넣기 */
  autoRoutine: boolean;
}

/** 하루의 할 일 개수 요약 (월간 달력 표시용) */
export interface DaySummary {
  done: number;
  total: number;
}

/** 저장소 추상화 — 지금은 localStorage, 이후 서버(DB)로 교체 가능 */
export interface Storage {
  getDay(ymd: string): Promise<DayDoc | null>;
  saveDay(ymd: string, doc: DayDoc): Promise<void>;
  /** "YYYY-MM" 한 달 동안 할 일이 있는 날의 요약. 키는 "YYYY-MM-DD" */
  getMonthSummary(ym: string): Promise<Record<string, DaySummary>>;
  getSomeday(): Promise<Task[]>;
  saveSomeday(items: Task[]): Promise<void>;
  getRoutines(): Promise<Routine[]>;
  saveRoutines(items: Routine[]): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}
