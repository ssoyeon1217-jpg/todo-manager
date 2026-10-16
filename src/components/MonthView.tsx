import { useEffect, useState } from "react";
import { WEEKDAYS } from "../constants";
import { buildMonthGrid, toYmd } from "../lib/date";
import type { DaySummary, Storage } from "../types";

interface Props {
  /** 지금 보고 있는 날짜 */
  selected: Date;
  store: Storage;
  /** 날짜를 눌렀을 때 */
  onPick: (d: Date) => void;
  onClose: () => void;
}

/** 월간 달력. 할 일이 있는 날은 색이 칠해지고, 모두 끝낸 날은 ✓ 로 표시됩니다. */
export default function MonthView({ selected, store, onPick, onClose }: Props) {
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const [summary, setSummary] = useState<Record<string, DaySummary>>({});

  const year = month.getFullYear();
  const month0 = month.getMonth();
  const ym = `${year}-${String(month0 + 1).padStart(2, "0")}`;

  useEffect(() => {
    let alive = true;
    void store.getMonthSummary(ym).then((s) => {
      if (alive) setSummary(s);
    });
    return () => {
      alive = false;
    };
  }, [store, ym]);

  const cells = buildMonthGrid(year, month0);
  const todayYmd = toYmd(new Date());
  const selectedYmd = toYmd(selected);

  return (
    <div>
      <div className="mhead">
        <button className="nav" aria-label="이전 달" onClick={() => setMonth(new Date(year, month0 - 1, 1))}>
          ‹
        </button>
        <h3>
          {year}년 {month0 + 1}월
        </h3>
        <button className="nav" aria-label="다음 달" onClick={() => setMonth(new Date(year, month0 + 1, 1))}>
          ›
        </button>
      </div>

      <div className="sub">
        <button className="pill" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
          이번 달
        </button>
        <button className="pill" onClick={onClose}>
          닫기
        </button>
      </div>

      <div className="mgrid mdow" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="mgrid">
        {cells.map((day, i) => {
          if (day === null) return <span key={i} className="mcell blank" />;
          const ymd = `${ym}-${String(day).padStart(2, "0")}`;
          const s = summary[ymd];
          const classes = ["mcell"];
          if (s) classes.push(s.done === s.total ? "all" : "has");
          if (ymd === todayYmd) classes.push("today");
          if (ymd === selectedYmd) classes.push("sel");
          return (
            <button
              key={i}
              type="button"
              className={classes.join(" ")}
              aria-label={`${month0 + 1}월 ${day}일${s ? `, ${s.total}개 중 ${s.done}개 완료` : ""}`}
              onClick={() => onPick(new Date(year, month0, day))}
            >
              <span>{day}</span>
              {s && <small>{s.done === s.total ? "✓" : `${s.done}/${s.total}`}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
