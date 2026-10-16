import { useEffect, useRef, type ReactNode } from "react";
import Sortable from "sortablejs";

interface Props {
  /** 드래그가 끝났을 때 (원래 자리, 새 자리) */
  onReorder: (from: number, to: number) => void;
  children: ReactNode;
}

/**
 * 드래그로 순서를 바꾸는 목록. 항목 안의 ".grip"(⋮⋮)을 잡고 끌면 됩니다.
 * 마우스와 터치(휴대폰) 모두 동작합니다.
 *
 * Sortable 이 직접 옮긴 DOM 은 되돌려 놓고, 실제 순서는 React 상태(onReorder)로만 바꿉니다.
 * 그래야 화면과 저장된 데이터가 어긋나지 않습니다.
 */
export default function SortableList({ onReorder, children }: Props) {
  const ref = useRef<HTMLUListElement>(null);
  const handler = useRef(onReorder);
  handler.current = onReorder;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sortable = Sortable.create(el, {
      handle: ".grip",
      animation: 150,
      ghostClass: "ghost",
      onEnd(evt) {
        const { oldIndex, newIndex, item, from } = evt;
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
        from.removeChild(item);
        from.insertBefore(item, from.children[oldIndex] ?? null);
        handler.current(oldIndex, newIndex);
      },
    });
    return () => sortable.destroy();
  }, []);

  return <ul ref={ref}>{children}</ul>;
}
