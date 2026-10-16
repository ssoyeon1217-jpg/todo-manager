import type { SubItem } from "../types";
import MarkIcon, { MARK_NAME } from "./MarkIcon";

interface Props {
  subs: SubItem[];
  /** 표시를 눌렀을 때 (세부 항목 id) */
  onCycle: (subId: string) => void;
}

/** 항목 아래에 보이는 세부 항목 목록. 표시를 누를 때마다 ○ △ ✕ 로 바뀝니다. */
export default function SubList({ subs, onCycle }: Props) {
  return (
    <ul className="subs">
      {subs.map((s) => (
        <li key={s.id} data-m={s.mark ?? ""}>
          <button
            type="button"
            className="mk"
            aria-label={`${s.text}, ${s.mark ? MARK_NAME[s.mark] : "표시 없음"}. 누르면 바뀌어요`}
            onClick={() => onCycle(s.id)}
          >
            <MarkIcon mark={s.mark} />
          </button>
          <span className="sub-txt">{s.text}</span>
        </li>
      ))}
    </ul>
  );
}
