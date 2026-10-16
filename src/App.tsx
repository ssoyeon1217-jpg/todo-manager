import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, GripVertical, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MonthView from "./components/MonthView";
import RoutinesView from "./components/RoutinesView";
import SortableList from "./components/SortableList";
import SubEditor from "./components/SubEditor";
import SubList from "./components/SubList";
import { DEFAULT_SETTINGS, REST_SECTION, SOMEDAY_SECTION, WORK_SECTIONS } from "./constants";
import { addDays, daysFromToday, startOfToday, titleParts, toYmd } from "./lib/date";
import { applyRoutines } from "./lib/routines";
import {
  blankDay,
  cycleSubMark,
  editTask,
  insertAt,
  makeSub,
  makeTask,
  progressOf,
  reorder,
  sortTimedInPlace,
  subProgress,
  withSection,
} from "./lib/tasks";
import type { DayDoc, Routine, SectionKey, Settings, Storage, SubItem, Task } from "./types";

type DaySection = Exclude<SectionKey, "someday">;

/** 지금 수정 중인 항목 */
interface Editing {
  from: DaySection;
  id: string;
  text: string;
  time: string;
  section: DaySection;
  subs: SubItem[];
  /** 세부 항목 입력창에 적어 둔(아직 '추가'를 누르지 않은) 글 */
  subDraft: string;
}

/** 방금 지운 항목 (되돌리기용) */
type UndoState =
  | { kind: "day"; ymd: string; key: DaySection; index: number; task: Task }
  | { kind: "someday"; index: number; task: Task };

const UNDO_MS = 6000;

interface AppProps {
  store: Storage;
  /** 로그인한 계정 (서버 모드일 때만) */
  email?: string;
  onSignOut?: () => void;
}

export default function App({ store, email, onSignOut }: AppProps) {
  const [view, setView] = useState<"day" | "month" | "routines">("day");
  const [cur, setCur] = useState<Date>(startOfToday);
  const [doc, setDoc] = useState<DayDoc>(blankDay());
  const [someday, setSomeday] = useState<Task[]>([]);
  const [target, setTarget] = useState<SectionKey>("school");
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [bringId, setBringId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [ready, setReady] = useState(false);
  const [loadedYmd, setLoadedYmd] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const noticeTimer = useRef<number | undefined>(undefined);

  const ymd = toYmd(cur);
  const mode: DayDoc["mode"] = doc.mode ?? "work";
  const sections = mode === "rest" ? [REST_SECTION] : WORK_SECTIONS;
  // 입력창에서 실제로 추가될 칸 (쉬는 날엔 '오늘 할 일' 또는 '언젠가' 둘뿐)
  const effTarget: SectionKey = target === "someday" ? "someday" : mode === "rest" ? "rest" : target;

  // 설정·루틴·'언젠가' 목록은 날짜와 상관없이 처음 한 번만 불러옵니다.
  useEffect(() => {
    let alive = true;
    void Promise.all([store.getSettings(), store.getRoutines(), store.getSomeday()]).then(([st, rt, sd]) => {
      if (!alive) return;
      setSettings(st);
      setRoutines(rt);
      setSomeday(sd);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // 날짜가 바뀌면 그날 문서를 불러옵니다. (설정을 먼저 읽은 뒤에)
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    setEditing(null);
    setBringId(null);
    setUndo((u) => (u?.kind === "day" ? null : u));
    void store.getDay(ymd).then((d) => {
      if (!alive) return;
      const defaultMode = settings.restDays.includes(cur.getDay()) ? "rest" : "work";
      setDoc(d ?? blankDay(defaultMode));
      setLoadedYmd(ymd);
    });
    return () => {
      alive = false;
    };
    // settings.restDays 는 새 날짜를 열 때만 읽으면 되므로 의존성에서 뺍니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ymd, cur, ready]);

  // 오늘·내일을 처음 열 때 그 요일의 루틴을 자동으로 넣습니다. (날짜마다 한 번만)
  useEffect(() => {
    if (!ready || view !== "day" || loadedYmd !== ymd) return;
    if (!settings.autoRoutine || routines.length === 0 || doc.routinesDone) return;
    const ahead = daysFromToday(cur);
    if (ahead < 0 || ahead > 1) return;
    const { doc: next, added } = applyRoutines(doc, routines, cur.getDay());
    update({ ...next, routinesDone: true });
    if (added > 0) flash(`루틴 ${added}개를 넣었어요`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, view, loadedYmd, ymd, doc, routines, settings.autoRoutine]);

  useEffect(
    () => () => {
      window.clearTimeout(undoTimer.current);
      window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  function update(next: DayDoc) {
    setDoc(next);
    void store.saveDay(ymd, next);
  }

  function updateSomeday(next: Task[]) {
    setSomeday(next);
    void store.saveSomeday(next);
  }

  function updateRoutines(next: Routine[]) {
    setRoutines(next);
    void store.saveRoutines(next);
  }

  function updateSettings(next: Settings) {
    setSettings(next);
    void store.saveSettings(next);
  }

  function flash(msg: string) {
    window.clearTimeout(noticeTimer.current);
    setNotice(msg);
    noticeTimer.current = window.setTimeout(() => setNotice(null), UNDO_MS / 2);
  }

  /** 이 날의 루틴을 직접 넣습니다. (이미 있는 건 건너뜀) */
  function applyToday() {
    const { doc: next, added } = applyRoutines(doc, routines, cur.getDay());
    update({ ...next, routinesDone: true });
    flash(added > 0 ? `루틴 ${added}개를 넣었어요` : "이 요일 루틴은 이미 다 들어가 있어요");
  }

  function closeRoutines() {
    // 이름을 적지 않은 루틴은 정리합니다.
    const kept = routines.filter((r) => r.text.trim());
    if (kept.length !== routines.length) updateRoutines(kept);
    setView("day");
  }

  function cycleMark(key: DaySection, taskId: string, subId: string) {
    update(cycleSubMark(doc, key, taskId, subId));
  }

  function showUndo(u: UndoState) {
    window.clearTimeout(undoTimer.current);
    setUndo(u);
    undoTimer.current = window.setTimeout(() => setUndo(null), UNDO_MS);
  }

  function doUndo() {
    if (!undo) return;
    if (undo.kind === "day") {
      if (undo.ymd === ymd) {
        const list = insertAt(doc.sections[undo.key] ?? [], undo.index, undo.task);
        update(withSection(doc, undo.key, sortTimedInPlace(list)));
      }
    } else {
      updateSomeday(insertAt(someday, undo.index, undo.task));
    }
    window.clearTimeout(undoTimer.current);
    setUndo(null);
  }

  function add() {
    if (!text.trim()) return;
    if (effTarget === "someday") {
      updateSomeday([...someday, makeTask(text)]);
    } else {
      const list = [...(doc.sections[effTarget] ?? []), makeTask(text)];
      update(withSection(doc, effTarget, sortTimedInPlace(list)));
    }
    setText("");
  }

  function toggle(key: DaySection, id: string) {
    const list = (doc.sections[key] ?? []).map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    update(withSection(doc, key, list));
  }

  function remove(key: DaySection, id: string) {
    const list = doc.sections[key] ?? [];
    const index = list.findIndex((t) => t.id === id);
    if (index < 0) return;
    update(withSection(doc, key, list.filter((t) => t.id !== id)));
    if (editing?.id === id) setEditing(null);
    showUndo({ kind: "day", ymd, key, index, task: list[index] });
  }

  function removeSomeday(id: string) {
    const index = someday.findIndex((t) => t.id === id);
    if (index < 0) return;
    updateSomeday(someday.filter((t) => t.id !== id));
    showUndo({ kind: "someday", index, task: someday[index] });
  }

  function reorderIn(key: DaySection, from: number, to: number) {
    update(withSection(doc, key, sortTimedInPlace(reorder(doc.sections[key] ?? [], from, to))));
  }

  function startEdit(key: DaySection, t: Task) {
    setEditing({
      from: key,
      id: t.id,
      text: t.text,
      time: t.time ?? "",
      section: key,
      subs: t.subs ?? [],
      subDraft: "",
    });
  }

  function saveEdit() {
    if (!editing) return;
    // 내용이 비어 있으면 저장하지 않고 그대로 둡니다. (삭제는 ✕ 버튼으로)
    if (!editing.text.trim()) return;
    // 입력창에 적어 두고 '추가'를 안 누른 세부 항목도 함께 저장합니다.
    const subs = editing.subDraft.trim() ? [...editing.subs, makeSub(editing.subDraft)] : editing.subs;
    update(
      editTask(doc, editing.from, editing.id, {
        text: editing.text,
        time: editing.time,
        section: editing.section,
        subs,
      }),
    );
    setEditing(null);
  }

  /** '언젠가' 항목을 오늘의 한 칸으로 가져옵니다. */
  function bring(id: string, key: DaySection) {
    const task = someday.find((t) => t.id === id);
    if (!task) return;
    updateSomeday(someday.filter((t) => t.id !== id));
    const list = [...(doc.sections[key] ?? []), { ...task, done: false }];
    update(withSection(doc, key, sortTimedInPlace(list)));
    setBringId(null);
  }

  function onBringClick(id: string) {
    if (sections.length === 1) bring(id, sections[0].key as DaySection);
    else setBringId(bringId === id ? null : id);
  }

  const all = sections.flatMap((s) => doc.sections[s.key as DaySection] ?? []);
  const { done, total } = progressOf(all);

  if (view === "routines") {
    return (
      <div className="wrap">
        <RoutinesView
          routines={routines}
          settings={settings}
          onRoutines={updateRoutines}
          onSettings={updateSettings}
          onClose={closeRoutines}
          email={email}
          onSignOut={onSignOut}
        />
      </div>
    );
  }

  if (view === "month") {
    return (
      <div className="wrap">
        <MonthView
          selected={cur}
          store={store}
          onPick={(d) => {
            setCur(d);
            setView("day");
          }}
          onClose={() => setView("day")}
        />
      </div>
    );
  }

  const chips = [...sections, SOMEDAY_SECTION];
  const { relative, date: dateText } = titleParts(cur);
  const isToday = relative === "오늘";

  return (
    <div className="wrap">
      <header>
        <div className="title">
          <p className="eyebrow">{relative ?? `${cur.getFullYear()}년`}</p>
          <h1>{dateText}</h1>
        </div>
        <button className="icon-btn" aria-label="이전 날" onClick={() => setCur(addDays(cur, -1))}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button className="icon-btn" aria-label="다음 날" onClick={() => setCur(addDays(cur, 1))}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <button className="icon-btn" aria-label="달력 보기" onClick={() => setView("month")}>
          <CalendarDays size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="toolbar">
        {!isToday && (
          <button type="button" className="text-btn" onClick={() => setCur(startOfToday())}>
            오늘로
          </button>
        )}
        {routines.length > 0 && (
          <button type="button" className="text-btn" onClick={applyToday}>
            루틴 넣기
          </button>
        )}
        <button type="button" className="text-btn" onClick={() => setView("routines")}>
          루틴 설정
        </button>
      </div>

      <div className="progress" aria-label={`${total}개 중 ${done}개 완료`}>
        <span>
          {done}/{total}
        </span>
        <div className="track">
          <i style={{ transform: `scaleX(${total ? done / total : 0})` }} />
        </div>
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <div className="chips">
          {chips.map((s) => (
            <button
              type="button"
              key={s.key}
              className="chip"
              style={{ ["--dot" as string]: `var(${s.dot})` }}
              aria-pressed={effTarget === s.key}
              onClick={() => setTarget(s.key)}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="addrow">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="할 일을 입력하세요"
            aria-label="할 일"
          />
          <button type="submit" className="primary-btn" disabled={!text.trim()}>
            추가
          </button>
        </div>
      </form>

      {total === 0 && (
        <p className="empty-day">
          {mode === "rest" ? "오늘 할 일이 아직 없어요." : "이 날의 할 일이 아직 없어요."} 위에서 칸을 고르고 추가해 보세요.
        </p>
      )}

      <div className="rail">
        {sections.map((s) => {
          const key = s.key as DaySection;
          const list = doc.sections[key] ?? [];
          return (
            <section key={s.key} style={{ ["--dot" as string]: `var(${s.dot})` }}>
              <h2>
                {s.name} <small>{list.length ? `${list.filter((t) => t.done).length}/${list.length}` : ""}</small>
              </h2>
              <SortableList onReorder={(from, to) => reorderIn(key, from, to)}>
                {list.map((t) =>
                  editing && editing.id === t.id ? (
                    <li key={t.id} className="editing">
                      <form
                        className="edform"
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveEdit();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setEditing(null);
                        }}
                      >
                        <input
                          className="ed-in"
                          autoFocus
                          value={editing.text}
                          onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                          aria-label="할 일 수정"
                        />
                        <SubEditor
                          subs={editing.subs}
                          draft={editing.subDraft}
                          onChange={(subs) => setEditing({ ...editing, subs })}
                          onDraft={(subDraft) => setEditing({ ...editing, subDraft })}
                        />
                        <div className="ed-bar">
                          {mode === "work" && (
                            <select
                              value={editing.section}
                              onChange={(e) =>
                                setEditing({ ...editing, section: e.target.value as DaySection })
                              }
                              aria-label="칸 이동"
                            >
                              {WORK_SECTIONS.map((w) => (
                                <option key={w.key} value={w.key}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                          )}
                          <div className="actions">
                            <button type="button" className="text-btn" onClick={() => setEditing(null)}>
                              취소
                            </button>
                            <button type="submit" className="outline-btn">
                              저장
                            </button>
                          </div>
                        </div>
                      </form>
                    </li>
                  ) : (
                    <li key={t.id} className={t.done ? "done" : ""}>
                      <span className="grip" aria-hidden="true">
                        <GripVertical size={16} />
                      </span>
                      <input
                        type="checkbox"
                        className="cb"
                        checked={t.done}
                        onChange={() => toggle(key, t.id)}
                        aria-label={`${t.text} 완료`}
                      />
                      {t.time && <small className="tm">{t.time}</small>}
                      <button
                        type="button"
                        className="txt"
                        aria-label={`${t.text} 수정`}
                        onClick={() => startEdit(key, t)}
                      >
                        {t.text}
                      </button>
                      {t.subs && t.subs.length > 0 && (
                        <small className="subcount" aria-label={`세부 항목 ${subProgress(t).total}개 중 ${subProgress(t).done}개 했어요`}>
                          {subProgress(t).done}/{subProgress(t).total}
                        </small>
                      )}
                      <button className="x" aria-label={`${t.text} 삭제`} onClick={() => remove(key, t.id)}>
                        <X size={18} aria-hidden="true" />
                      </button>
                      {t.subs && t.subs.length > 0 && (
                        <SubList subs={t.subs} onCycle={(subId) => cycleMark(key, t.id, subId)} />
                      )}
                    </li>
                  ),
                )}
              </SortableList>
            </section>
          );
        })}
      </div>

      <details className="someday">
        <summary>
          <span>언젠가</span>
          <small>{someday.length ? `${someday.length}개` : ""}</small>
          <ChevronDown className="chev" size={18} aria-hidden="true" />
        </summary>
        {someday.length === 0 ? (
          <p className="empty">언젠가 할 일을 위의 '언젠가' 칸으로 추가해 두세요.</p>
        ) : (
          <SortableList onReorder={(from, to) => updateSomeday(reorder(someday, from, to))}>
            {someday.map((t) => (
              <li key={t.id}>
                <span className="grip" aria-hidden="true">
                  <GripVertical size={16} />
                </span>
                <span className="txt">{t.text}</span>
                <button type="button" className="outline-btn" onClick={() => onBringClick(t.id)}>
                  오늘로
                </button>
                <button className="x" aria-label={`${t.text} 삭제`} onClick={() => removeSomeday(t.id)}>
                  <X size={18} aria-hidden="true" />
                </button>
                {bringId === t.id && (
                  <div className="pick">
                    {sections.map((s) => (
                      <button
                        type="button"
                        key={s.key}
                        className="chip"
                        style={{ ["--dot" as string]: `var(${s.dot})` }}
                        onClick={() => bring(t.id, s.key as DaySection)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </SortableList>
        )}
      </details>

      {undo ? (
        <div className="snack" role="status">
          <span>삭제했어요</span>
          <button type="button" onClick={doUndo}>
            되돌리기
          </button>
        </div>
      ) : (
        notice && (
          <div className="snack notice" role="status">
            <span>{notice}</span>
          </div>
        )
      )}
    </div>
  );
}
