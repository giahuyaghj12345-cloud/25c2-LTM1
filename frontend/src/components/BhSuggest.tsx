import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SuggestItem<T> = { value: string; text: string; raw: T };

type Props<T> = {
  value: string;
  items: SuggestItem<T>[];
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onPick: (item: SuggestItem<T>) => void;
};

export default function BhSuggest<T>({ value, items, disabled, placeholder, onChange, onPick }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const needle = value.trim().toLowerCase();
  const matches = useMemo(() => {
    const list = needle
      ? items.filter((item) => `${item.value} ${item.text}`.toLowerCase().includes(needle))
      : items;
    return list.slice(0, 8);
  }, [items, needle]);

  const place = () => {
    const input = box.current?.querySelector("input");
    if (input) setRect(input.getBoundingClientRect());
  };

  useEffect(() => {
    if (!open) return;
    place();
    const move = () => place();
    window.addEventListener("scroll", move, true);
    window.addEventListener("resize", move);
    return () => {
      window.removeEventListener("scroll", move, true);
      window.removeEventListener("resize", move);
    };
  }, [open, value]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!box.current?.contains(target) && !list.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const choose = (item: SuggestItem<T>) => {
    onPick(item);
    setOpen(false);
  };

  return (
    <div className="bh-ac" ref={box}>
      <div className="bh-ac-row">
        <input
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((n) => Math.min(n + 1, Math.max(matches.length - 1, 0)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((n) => Math.max(n - 1, 0));
            } else if (e.key === "Enter" && open && matches[active]) {
              e.preventDefault();
              choose(matches[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <button
          type="button"
          className="bh-ac-btn"
          disabled={disabled}
          aria-label="Chọn mã"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => setOpen((valueOpen) => !valueOpen)}
        >
          ▾
        </button>
      </div>
      {open && !disabled && matches.length > 0 && rect && createPortal(
        <ul ref={list} className="bh-ac-list" style={{ position: "fixed", top: rect.bottom + 2, left: rect.left, width: Math.max(rect.width, 280), zIndex: 80 }}>
          {matches.map((item, index) => (
            <li key={`${item.value}-${index}`}>
              <button type="button" className={index === active ? "is-on" : ""} onMouseDown={(e) => { e.preventDefault(); choose(item); }}>
                <b>{item.value}</b>
                <span>{item.text}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
