import { Circle, Triangle, X } from "lucide-react";
import type { Mark } from "../types";

export const MARK_NAME: Record<Exclude<Mark, null>, string> = {
  o: "했어요",
  t: "일부만 했어요",
  x: "못 했어요",
};

/** ○ △ ✕ 표시 아이콘. 표시가 없으면 흐린 동그라미를 보여줍니다. */
export default function MarkIcon({ mark }: { mark: Mark }) {
  const common = { size: 18, strokeWidth: 2.4, "aria-hidden": true } as const;
  if (mark === "o") return <Circle {...common} />;
  if (mark === "t") return <Triangle {...common} />;
  if (mark === "x") return <X {...common} />;
  return <Circle {...common} className="mk-empty" />;
}
