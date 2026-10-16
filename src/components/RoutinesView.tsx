import { X } from "lucide-react";
import { WEEKDAYS, WORK_SECTIONS } from "../constants";
import { newId } from "../lib/tasks";
import type { Routine, Settings, WorkSectionKey } from "../types";

interface Props {
  routines: Routine[];
  settings: Settings;
  onRoutines: (next: Routine[]) => void;
  onSettings: (next: Settings) => void;
  onClose: () => void;
  email?: string;
  onSignOut?: () => void;
}

function toggleDay(list: number[], d: number): number[] {
  return (list.includes(d) ? list.filter((x) => x !== d) : [...list, d]).sort((a, b) => a - b);
}

/** 루틴(요일별 반복)과 쉬는 요일 설정 화면. 바꾸면 바로 저장됩니다. */
export default function RoutinesView({ routines, settings, onRoutines, onSettings, onClose, email, onSignOut }: Props) {
  const patch = (id: string, p: Partial<Routine>) =>
    onRoutines(routines.map((r) => (r.id === id ? { ...r, ...p } : r)));

  return (
    <>
      <header>
        <div className="title">
          <p className="eyebrow">반복</p>
          <h1>루틴</h1>
        </div>
        <button className="icon-btn" aria-label="루틴 닫기" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="rsec">
        <h2>루틴 목록</h2>
        <p className="rhint">정해 둔 요일에 맞춰 그날의 칸에 자동으로 들어가요. 요일을 고르지 않으면 매일이에요.</p>
        {routines.length === 0 && <p className="empty">아직 루틴이 없어요.</p>}
        <ul>
          {routines.map((r) => (
            <li key={r.id} className="ritem">
              <div className="r-top">
                <input
                  className="r-name"
                  value={r.text}
                  autoFocus={r.text === ""}
                  placeholder="루틴 이름"
                  aria-label="루틴 이름"
                  onChange={(e) => patch(r.id, { text: e.target.value })}
                />
                <button
                  type="button"
                  className="x"
                  aria-label={`${r.text || "루틴"} 삭제`}
                  onClick={() => onRoutines(routines.filter((x) => x.id !== r.id))}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <select
                value={r.section}
                aria-label="넣을 칸"
                onChange={(e) => patch(r.id, { section: e.target.value as WorkSectionKey })}
              >
                {WORK_SECTIONS.map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.name}
                  </option>
                ))}
              </select>
              <div className="days" role="group" aria-label="반복 요일">
                {WEEKDAYS.map((name, d) => (
                  <button
                    type="button"
                    key={name}
                    className="daybtn"
                    aria-pressed={r.days.includes(d)}
                    onClick={() => patch(r.id, { days: toggleDay(r.days, d) })}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={r.workOnly === true}
                  onChange={(e) => patch(r.id, { workOnly: e.target.checked || undefined })}
                />
                쉬는 날엔 넣지 않기
              </label>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="outline-btn"
          onClick={() => onRoutines([...routines, { id: newId(), text: "", section: "home", days: [] }])}
        >
          루틴 추가
        </button>
      </div>

      <div className="rsec">
        <h2>설정</h2>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.autoRoutine}
            onChange={(e) => onSettings({ ...settings, autoRoutine: e.target.checked })}
          />
          오늘·내일을 처음 열 때 루틴 자동으로 넣기
        </label>
        <p className="rhint">쉬는 요일 (이 요일엔 '오늘 할 일' 한 칸만 보여요)</p>
        <div className="days" role="group" aria-label="쉬는 요일">
          {WEEKDAYS.map((name, d) => (
            <button
              type="button"
              key={name}
              className="daybtn"
              aria-pressed={settings.restDays.includes(d)}
              onClick={() => onSettings({ ...settings, restDays: toggleDay(settings.restDays, d) })}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {onSignOut && (
        <div className="rsec">
          <h2>계정</h2>
          {email && <p className="rhint">{email} 으로 로그인되어 있어요.</p>}
          <button type="button" className="outline-btn" onClick={onSignOut}>
            로그아웃
          </button>
        </div>
      )}
    </>
  );
}
