import { useEffect, useMemo, useRef, useState } from "react";
import MonthView from "./components/MonthView";
import SortableList from "./components/SortableList";
import { DEFAULT_REST_DAYS, REST_SECTION, SOMEDAY_SECTION, WORK_SECTIONS } from "./constants";
import { addDays, startOfToday, titleText, toYmd } from "./lib/date";
import { localStorageStore as store } from "./lib/storage";
import {
  blankDay,
  editTask,
  insertAt,
  makeTask,
  progressOf,
  reorder,
  sortTimedInPlace,
  withSection,
} from "./lib/tasks";
import type { DayDoc, SectionKey, Task } from "./types";

type DaySection = Exclude<SectionKey, "someday">;

/** 지금 수정 중인 항목 */
interface Editing {
  from: DaySection;
  id: string;
  text: string;
  time: string;
  section: DaySection;
}

/** 방금 지운 항목 (되돌리기용) */
type UndoState =
  | { kind: "day"; ymd: string; key: DaySection; index: number; task: Task }
  | { kind: "someday"; index: number; task: Task };

const UNDO_MS = 6000;

export default function App() {
  const [view, setView] = useState<"day" | "month">("day");
  const [cur, setCur] = useState<Date>(startOfToday);
  const [doc, setDoc] = useState<DayDoc>(blankDay());
  const [someday, setSomeday] = useState<Task[]>([]);
  const [target, setTarget] = useState<SectionKey>("school");
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [bringId, setBringId] = useState<string | null>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  const ymd = toYmd(cur);
  const mode: DayDoc["mode"] = useMemo(
    () => doc.mode ?? (DEFAULT_REST_DAYS.includes(cur.getDay()) ? "rest" : "work"),
    [doc.mode, cur],
  );
  const sections = mode === "rest" ? [REST_SECTION] : WORK_SECTIONS;
  // 입력창에서 실제로 추가될 칸 (쉬는 날엔 '오늘 할 일' 또는 '언젠가' 둘뿐)
  const effTarget: SectionKey = target === "someday" ? "someday" : mode === "rest" ? "rest" : target;

  // 날짜가 바뀌면 그날 문서를 불러옵니다.
  useEffect(() => {
    let alive = true;
    setEditing(null);
    setBringId(null);
    setUndo((u) => (u?.kind === "day" ? null : u));
    void store.getDay(ymd).then((d) => {
      if (!alive) return;
      const defaultMode = DEFAULT_REST_DAYS.includes(cur.getDay()) ? "rest" : "work";
      setDoc(d ?? blankDay(defaultMode));
    });
    return () => {
      alive = false;
    };
  }, [ymd, cur]);

  // '언젠가' 목록은 날짜와 상관없이 한 번만 불러옵니다.
  useEffect(() => {
    void store.getSomeday().then(setSomeday);
  }, []);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  function update(next: DayDoc) {
    setDoc(next);
    void store.saveDay(ymd, next);
  }

  function updateSomeday(next: Task[]) {
    setSomeday(next);
    void store.saveSomeday(next);
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
      const list = [...(doc.sections[effTarget] ?? []), makeTask(text, time || undefined)];
      update(withSection(doc, effTarget, sortTimedInPlace(list)));
    }
    setText("");
    setTime("");
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
    setEditing({ from: key, id: t.id, text: t.text, time: t.time ?? "", section: key });
  }

  function saveEdit() {
    if (!editing) return;
    // 내용이 비어 있으면 저장하지 않고 그대로 둡니다. (삭제는 ✕ 버튼으로)
    if (!editing.text.trim()) return;
    update(
      editTask(doc, editing.from, editing.id, {
        text: editing.text,
        time: editing.time,
        section: editing.section,
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

  return (
    <div className="wrap">
      <header>
        <button className="nav" aria-label="이전 날" onClick={() => setCur(addDays(cur, -1))}>
          ‹
        </button>
        <h1>{titleText(cur)}</h1>
        <button className="nav" aria-label="다음 날" onClick={() => setCur(addDays(cur, 1))}>
          ›
        </button>
      </header>

      <div className="sub">
        <button className="pill" onClick={() => setCur(startOfToday())}>
          오늘
        </button>
        <button className="pill" onClick={() => setView("month")}>
          달력
        </button>
      </div>

      <div className="progress">
        <span>
          {done}/{total}
        </span>
        <div className="bar">
          <i style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
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
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-label="시간(선택)"
            className="time"
            disabled={effTarget === "someday"}
          />
          <button type="submit">추가</button>
        </div>
      </form>

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
                          <input
                            type="time"
                            value={editing.time}
                            onChange={(e) => setEditing({ ...editing, time: e.target.value })}
                            aria-label="시간(선택)"
                          />
                          <button type="submit" className="ok">
                            저장
                          </button>
                          <button type="button" onClick={() => setEditing(null)}>
                            취소
                          </button>
                        </div>
                      </form>
                    </li>
                  ) : (
                    <li key={t.id} className={t.done ? "done" : ""}>
                      <span className="grip" aria-hidden="true">
                        ⋮⋮
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
                      <button className="x" aria-label={`${t.text} 삭제`} onClick={() => remove(key, t.id)}>
                        ✕
                      </button>
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
        </summary>
        {someday.length === 0 ? (
          <p className="empty">언젠가 할 일을 위의 '언젠가' 칸으로 추가해 두세요.</p>
        ) : (
          <SortableList onReorder={(from, to) => updateSomeday(reorder(someday, from, to))}>
            {someday.map((t) => (
              <li key={t.id}>
                <span className="grip" aria-hidden="true">
                  ⋮⋮
                </span>
                <span className="txt">{t.text}</span>
                <button type="button" className="bring" onClick={() => onBringClick(t.id)}>
                  오늘로
                </button>
                <button className="x" aria-label={`${t.text} 삭제`} onClick={() => removeSomeday(t.id)}>
                  ✕
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

      {undo && (
        <div className="snack" role="status">
          <span>삭제했어요</span>
          <button type="button" onClick={doUndo}>
            되돌리기
          </button>
        </div>
      )}
    </div>
  );
}
