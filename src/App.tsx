import { useEffect, useMemo, useState } from "react";
import { DEFAULT_REST_DAYS, REST_SECTION, WORK_SECTIONS } from "./constants";
import { addDays, startOfToday, titleText, toYmd } from "./lib/date";
import { localStorageStore as store } from "./lib/storage";
import { blankDay, editTask, makeTask, progressOf, sortTimedInPlace, withSection } from "./lib/tasks";
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

export default function App() {
  const [cur, setCur] = useState<Date>(startOfToday);
  const [doc, setDoc] = useState<DayDoc>(blankDay());
  const [target, setTarget] = useState<DaySection>("school");
  const [text, setText] = useState("");
  const [time, setTime] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);

  const ymd = toYmd(cur);
  const mode: DayDoc["mode"] = useMemo(
    () => doc.mode ?? (DEFAULT_REST_DAYS.includes(cur.getDay()) ? "rest" : "work"),
    [doc.mode, cur],
  );
  const sections = mode === "rest" ? [REST_SECTION] : WORK_SECTIONS;

  // 날짜가 바뀌면 그날 문서를 불러옵니다.
  useEffect(() => {
    let alive = true;
    setEditing(null);
    store.getDay(ymd).then((d) => {
      if (!alive) return;
      const defaultMode = DEFAULT_REST_DAYS.includes(cur.getDay()) ? "rest" : "work";
      setDoc(d ?? blankDay(defaultMode));
    });
    return () => {
      alive = false;
    };
  }, [ymd, cur]);

  function update(next: DayDoc) {
    setDoc(next);
    void store.saveDay(ymd, next);
  }

  function add() {
    if (!text.trim()) return;
    const key: DaySection = mode === "rest" ? "rest" : target;
    const list = [...(doc.sections[key] ?? []), makeTask(text, time || undefined)];
    update(withSection(doc, key, sortTimedInPlace(list)));
    setText("");
    setTime("");
  }

  function toggle(key: DaySection, id: string) {
    const list = (doc.sections[key] ?? []).map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    update(withSection(doc, key, list));
  }

  function remove(key: DaySection, id: string) {
    update(withSection(doc, key, (doc.sections[key] ?? []).filter((t) => t.id !== id)));
    if (editing?.id === id) setEditing(null);
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

  const all = sections.flatMap((s) => doc.sections[s.key as DaySection] ?? []);
  const { done, total } = progressOf(all);

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
        {mode === "work" && (
          <div className="chips">
            {WORK_SECTIONS.map((s) => (
              <button
                type="button"
                key={s.key}
                className="chip"
                style={{ ["--dot" as string]: `var(${s.dot})` }}
                aria-pressed={target === s.key}
                onClick={() => setTarget(s.key as DaySection)}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
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
              <ul>
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
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
