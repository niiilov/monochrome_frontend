import { CaretDown, Check } from "@phosphor-icons/react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

type SelectOption<Value extends string> = { value: Value; label: string };

type DashboardSelectProps<Value extends string> = {
  label: string;
  showLabel?: boolean;
  disabled?: boolean;
  options: readonly SelectOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
};

export function DashboardSelect<Value extends string>({
  label,
  showLabel = false,
  disabled = false,
  options,
  value,
  onChange,
}: DashboardSelectProps<Value>) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const search = useRef({ prefix: "", time: 0 });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const firstActiveIndex = Math.max(0, selectedIndex);
  const unavailable = disabled || options.length === 0;
  const open = activeIndex !== null && !unavailable;
  const listId = id + "-options";

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setActiveIndex(null);
      }
    }
    document.addEventListener("pointerdown", dismissOutside);
    return () => document.removeEventListener("pointerdown", dismissOutside);
  }, [open]);

  useLayoutEffect(() => {
    const button = trigger.current;
    const menu = list.current;
    if (!open || !button || !menu) return;

    const reposition = () => {
      const { left, top, bottom, width } = button.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight;
      const edge = 8;
      const gap = 4;
      const menuWidth = Math.min(width, viewportWidth - 2 * edge);
      menu.style.width = menuWidth + "px";
      menu.style.left = Math.max(edge, Math.min(left, viewportWidth - edge - menuWidth)) + "px";

      const below = viewportHeight - bottom - gap - edge;
      const above = top - gap - edge;
      const height = menu.scrollHeight + 2;
      const opensAbove = height > below && above > below;
      const maxHeight = Math.max(0, opensAbove ? above : below);
      menu.style.maxHeight = maxHeight + "px";
      menu.style.top = (opensAbove ? top - gap - Math.min(height, maxHeight) : bottom + gap) + "px";
    };
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (activeIndex === null) return;
    const menu = list.current;
    const option = menu?.children[activeIndex] as HTMLElement | undefined;
    if (!menu || !option) return;
    const end = option.offsetTop + option.offsetHeight;
    if (end > menu.scrollTop + menu.clientHeight) menu.scrollTop = end - menu.clientHeight;
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
  }, [activeIndex]);

  function select(index: number) {
    const next = options[index].value;
    if (next !== value) onChange(next);
    setActiveIndex(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = activeIndex === null ? firstActiveIndex : activeIndex + direction;
        setActiveIndex(Math.max(0, Math.min(nextIndex, options.length - 1)));
        return;
      }
      case "Home":
      case "End":
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        if (activeIndex === null) setActiveIndex(firstActiveIndex);
        else select(activeIndex);
        return;
      case "Escape":
        if (open) {
          event.preventDefault();
          event.stopPropagation();
          setActiveIndex(null);
        }
        return;
      case "Tab":
        setActiveIndex(null);
        return;
    }

    if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) return;
    const time = Date.now();
    const key = event.key.toLocaleLowerCase();
    const prefix = time - search.current.time < 700 ? search.current.prefix + key : key;
    search.current = { prefix, time };
    const match = options.findIndex((option) => option.label.toLocaleLowerCase().startsWith(prefix));
    if (match >= 0) {
      event.preventDefault();
      setActiveIndex(match);
    }
  }

  return (
    <div className="dash-select" ref={root}>
      {showLabel && <label id={id + "-label"} htmlFor={id}>{label}</label>}
      <button
        ref={trigger}
        id={id}
        type="button"
        className="dash-input dash-select-trigger"
        role="combobox"
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? id + "-label" : undefined}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={open}
        aria-activedescendant={open ? listId + "-" + activeIndex : undefined}
        disabled={unavailable}
        onClick={(event) => {
          event.currentTarget.focus();
          setActiveIndex(open ? null : firstActiveIndex);
        }}
        onBlur={() => {
          search.current = { prefix: "", time: 0 };
          setActiveIndex(null);
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{options[selectedIndex]?.label ?? label}</span>
        <CaretDown size={16} aria-hidden="true" />
      </button>
      <ul ref={list} id={listId} className="dash-select-options" role="listbox" aria-label={label} hidden={!open}>
        {options.map((option, index) => (
          <li
            key={option.value}
            id={listId + "-" + index}
            role="option"
            aria-selected={index === selectedIndex}
            data-active={index === activeIndex}
            onMouseDown={(event) => event.preventDefault()}
            onPointerMove={(event) => {
              if (event.pointerType === "mouse") setActiveIndex(index);
            }}
            onClick={() => select(index)}
          >
            <span>{option.label}</span>
            {index === selectedIndex && <Check size={16} weight="bold" aria-hidden="true" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
