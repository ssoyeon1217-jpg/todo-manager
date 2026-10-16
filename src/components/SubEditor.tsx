import { X } from "lucide-react";
import type { SubItem } from "../types";
import { makeSub } from "../lib/tasks";

interface Props {
  subs: SubItem[];
  /** 아직 '추가'를 누르지 않고 입력창에 적어 둔 글 */
  draft: string;
  onChange: (subs: SubItem[]) => void;
  onDraft: (text: string) => void;
}

/** 수정 화면 안에서 세부 항목을 고치고 더하고 지우는 부분 */
export default function SubEditor({ subs, draft, onChange, onDraft }: Props) {
  function addDraft() {
    if (!draft.trim()) return;
    onChange([...subs, makeSub(draft)]);
    onDraft("");
  }

  return (
    <div className="subedit">
      <p className="sub-label">세부 항목</p>
      {subs.map((s) => (
        <div className="subrow" key={s.id}>
          <input
            value={s.text}
            aria-label="세부 항목"
            onChange={(e) => onChange(subs.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))}
          />
          <button
            type="button"
            className="x"
            aria-label={`${s.text || "세부 항목"} 지우기`}
            onClick={() => onChange(subs.filter((x) => x.id !== s.id))}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ))}
      <div className="subrow">
        <input
          value={draft}
          placeholder="세부 항목 추가"
          aria-label="새 세부 항목"
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
            e.preventDefault();
            addDraft();
          }}
        />
        <button type="button" className="outline-btn" disabled={!draft.trim()} onClick={addDraft}>
          추가
        </button>
      </div>
    </div>
  );
}
