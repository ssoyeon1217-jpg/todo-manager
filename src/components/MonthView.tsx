import { ChevronLeft, ChevronRight, X } from "lucide-react";
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

/** 월간 달력. 할 일이 있는 날은 옅게 칠하고, 모두 끝낸 날은 초록 톤과 완료 표시로 구분합니다. */
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
  const now = new Date();
  const todayYmd = toYmd(now);
  const selectedYmd = toYmd(selected);
  const isThisMonth = year === now.getFullYear() && month0 === now.getMonth();

  return (
    <div>
      <div className="mhead">
        <div className="title">
          <p className="eyebrow">{year}년</p>
          <h1>{month0 + 1}월</h1>
        </div>
        {!isThisMonth && (
          <button className="text-btn" onClick={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))}>
            이번 달
          </button>
        )}
        <button className="icon-btn" aria-label="이전 달" onClick={() => setMonth(new Date(year, month0 - 1, 1))}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button className="icon-btn" aria-label="다음 달" onClick={() => setMonth(new Date(year, month0 + 1, 1))}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <button className="icon-btn" aria-label="달력 닫기" onClick={onClose}>
          <X size={20} aria-hidden="true" />
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
          const allDone = !!s && s.done === s.total;
          const classes = ["mcell"];
          if (s) classes.push(allDone ? "all" : "has");
          if (ymd === todayYmd) classes.push("today");
          if (ymd === selectedYmd) classes.push("sel");
          return (
            <button
              key={i}
              type="button"
              className={classes.join(" ")}
              aria-label={`${month0 + 1}월 ${day}일${s ? `, ${s.total}개 중 ${s.done}개 완료` : ""}`}
              aria-current={ymd === todayYmd ? "date" : undefined}
              onClick={() => onPick(new Date(year, month0, day))}
            >
              <span>{day}</span>
              {s && <small>{allDone ? "완료" : `${s.done}/${s.total}`}</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
