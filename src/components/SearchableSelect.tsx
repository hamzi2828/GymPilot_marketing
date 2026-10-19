"use client";

// Every dropdown on the site and in the platform panel: a list that can be
// searched, in the manner of Select2. It takes the props and the <option> /
// <optgroup> children of a <select>, and keeps a real one out of sight for the
// form: its name, required and value are what the form posts and checks, and
// picking an option fires that select's own change event, so onChange gets
// the event it always did (e.target.value, e.target.name).
//
// The list opens over the page, fixed beside the field (above it when there is
// no room below), so a panel or a modal that clips what it holds never cuts it
// off and nothing on the page moves. The search box is always there; typing on
// the closed field opens it with that letter already in. Arrow keys, Page
// Up/Down, Enter and Escape work as in a native select, and a click on the
// field's own label opens it like a click on the field.

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiCheck, FiChevronDown, FiSearch } from "react-icons/fi";

/** The classes that give the field and its list their look. */
export type SelectSkin = {
  trigger: string;
  placeholder: string;
  chevron: string;
  popup: string;
  search: string;
  searchIcon: string;
  list: string;
  group: string;
  option: string;
  active: string;
  selected: string;
  disabled: string;
  check: string;
  empty: string;
};

// The marketing site's two kinds of section: light (checkout) and dark (the
// demo and contact form).
const SKINS: Record<"light" | "dark", SelectSkin> = {
  light: {
    trigger:
      "h-12 rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900 outline-none transition-colors focus:border-brand-400 focus:ring-4 focus:ring-brand-100 aria-expanded:border-brand-400 aria-expanded:ring-4 aria-expanded:ring-brand-100 disabled:cursor-not-allowed disabled:opacity-50",
    placeholder: "text-slate-400",
    chevron: "text-slate-400",
    popup: "rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-lift",
    search:
      "h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100",
    searchIcon: "text-slate-400",
    list: "",
    group: "text-slate-400",
    option: "text-slate-700",
    active: "bg-brand-50 text-brand-900",
    selected: "font-semibold text-brand-700",
    disabled: "cursor-not-allowed text-slate-300",
    check: "text-brand-600",
    empty: "text-slate-500",
  },
  dark: {
    trigger:
      "h-11 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 text-sm text-white focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 aria-expanded:border-brand-400 aria-expanded:ring-2 aria-expanded:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50",
    placeholder: "text-slate-500",
    chevron: "text-slate-400",
    popup: "rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl shadow-black/50 [color-scheme:dark]",
    search:
      "h-10 rounded-xl border border-white/10 bg-white/[0.05] pl-9 pr-3 text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30",
    searchIcon: "text-slate-500",
    list: "",
    group: "text-slate-500",
    option: "text-slate-200",
    active: "bg-white/[0.08] text-white",
    selected: "font-semibold text-white",
    disabled: "cursor-not-allowed text-slate-600",
    check: "text-brand-300",
    empty: "text-slate-400",
  },
};

export type SearchableSelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "multiple" | "size"> & {
  /** The section it sits in. The platform panel passes a `skin` of its own. */
  tone?: "light" | "dark";
  /** Classes in place of the tone's, part by part. */
  skin?: Partial<SelectSkin>;
  /** On the closed field while its value matches no option. */
  placeholder?: string;
  searchPlaceholder?: string;
  /** In the list when nothing matches the search. */
  noMatches?: string;
};

type Item = { value: string; label: string; disabled: boolean; group: string | null; index: number };
type Place = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

// Lower case and without accents, so "cafe" finds "Café".
const fold = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

type OptionProps = { children?: React.ReactNode; value?: string | number | readonly string[]; label?: string; disabled?: boolean };

// The options as a <select> would read them: an option's label is its label
// attribute or else its text, its value its value attribute or else that text,
// and a disabled group disables what it holds.
function readOptions(children: React.ReactNode, group: { label: string; disabled: boolean } | null = null, out: Item[] = []): Item[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement<OptionProps>(child)) return;
    const props = child.props;
    if (child.type === React.Fragment) {
      readOptions(props.children, group, out);
    } else if (child.type === "optgroup") {
      readOptions(props.children, { label: String(props.label ?? ""), disabled: !!props.disabled || !!group?.disabled }, out);
    } else if (child.type === "option") {
      const text = textOf(props.children).replace(/\s+/g, " ").trim();
      const label = props.label ? String(props.label) : text;
      out.push({ value: props.value !== undefined ? String(props.value) : text, label, disabled: !!props.disabled || !!group?.disabled, group: group?.label ?? null, index: out.length });
    }
  });
  return out;
}

const matches = (item: Item, term: string) => !term || fold(item.label).includes(term) || (item.group !== null && fold(item.group).includes(term));

// Where the list goes: under the field, or over it when there is more room
// above; at least a comfortable width, and never past the edge of the screen.
function measure(field: HTMLElement): Place {
  const r = field.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const gap = 6;
  const edge = 8;
  const width = Math.min(Math.max(r.width, 208), vw - edge * 2);
  const left = Math.min(Math.max(edge, r.left), vw - width - edge);
  const below = vh - r.bottom - gap - edge;
  const above = r.top - gap - edge;
  const up = below < 220 && above > below;
  const maxHeight = Math.max(140, Math.min(340, up ? above : below));
  return up ? { left, width, bottom: vh - r.top + gap, maxHeight } : { left, width, top: r.bottom + gap, maxHeight };
}

// Full width unless the caller sets a width of its own (w-40, w-72 …).
const widthOf = (className?: string) => (/(^|\s)w-/.test(className || "") ? "" : "w-full");

export default function SearchableSelect(props: SearchableSelectProps) {
  const {
    tone = "light",
    skin,
    placeholder,
    searchPlaceholder = "Search…",
    noMatches = "No matches",
    className,
    style,
    children,
    value,
    defaultValue,
    onChange,
    disabled,
    required,
    id,
    title,
    autoFocus,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...rest
  } = props;
  const s = { ...SKINS[tone], ...skin };
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (index: number) => `${uid}-o${index}`;

  const items = readOptions(children);
  const controlled = value !== undefined;
  // Uncontrolled, the hidden select holds the value; this mirrors it.
  const [own, setOwn] = useState<string | null>(null);
  const current = controlled ? String(value) : own ?? (defaultValue !== undefined ? String(defaultValue) : items.find((i) => !i.disabled)?.value ?? "");
  const chosen = items.find((i) => i.value === current) || null;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<Place | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const term = fold(query.trim());
  const shown = items.filter((i) => matches(i, term));
  const pickable = shown.filter((i) => !i.disabled);
  const firstMatch = (q: string) => items.find((i) => !i.disabled && matches(i, fold(q.trim())))?.index ?? -1;

  // Uncontrolled: start from what the select chose, and follow a form reset.
  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    setOwn(el.value);
    const onReset = () => setTimeout(() => setOwn(el.value));
    el.form?.addEventListener("reset", onReset);
    return () => el.form?.removeEventListener("reset", onReset);
  }, []);

  const openList = (seed = "") => {
    if (disabled || open || !triggerRef.current) return;
    setPlace(measure(triggerRef.current));
    setQuery(seed);
    setActive(seed ? firstMatch(seed) : chosen && !chosen.disabled ? chosen.index : firstMatch(""));
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (item: Item) => {
    if (item.disabled) return;
    close(true);
    const el = selectRef.current;
    if (!el || item.value === current) return;
    // As the browser does when someone picks an option: the select's value,
    // then its input and change events. React hands the change to onChange
    // and, for a controlled select, puts back whatever value it is then given.
    el.value = item.value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Open: the search box takes the keyboard, with the caret after any letter
  // typed on the closed field.
  useLayoutEffect(() => {
    const search = searchRef.current;
    if (!open || !search) return;
    search.focus({ preventScroll: true });
    search.setSelectionRange(search.value.length, search.value.length);
  }, [open]);

  // Open: a press anywhere else closes it, and it follows the field as the
  // page scrolls or resizes (closing once the field has gone off screen).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target) || wrapRef.current?.contains(target)) return;
      // The field's label clicks the field, which closes it.
      if (wrapRef.current?.closest("label")?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    const onMove = (e: Event) => {
      const field = triggerRef.current;
      if (!field || (e.type === "scroll" && popupRef.current?.contains(e.target as Node))) return;
      const r = field.getBoundingClientRect();
      if (r.bottom < 0 || r.top > document.documentElement.clientHeight) {
        setOpen(false);
        setQuery("");
        return;
      }
      setPlace(measure(field));
    };
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  // The highlighted option stays in view as the arrow keys move it (and the
  // chosen one is in view as the list opens).
  useLayoutEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!open || !list || !el) return;
    const lr = list.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (er.top < lr.top) list.scrollTop -= lr.top - er.top + 6;
    else if (er.bottom > lr.bottom) list.scrollTop += er.bottom - lr.bottom + 6;
  }, [open, active]);

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (open) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openList();
    } else if (e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Type to search: the first letter opens the list with it in the box.
      e.preventDefault();
      openList(e.key);
    }
  };

  const step = (by: number) => {
    if (!pickable.length) return;
    const at = pickable.findIndex((i) => i.index === active);
    const next = at < 0 ? (by > 0 ? 0 : pickable.length - 1) : Math.min(Math.max(at + by, 0), pickable.length - 1);
    setActive(pickable[next].index);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (e.altKey && e.key === "ArrowUp") close(true);
      else step(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      step(e.key === "PageDown" ? 8 : -8);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = pickable.find((i) => i.index === active);
      if (item) choose(item);
    } else if (e.key === "Escape") {
      // Closes the list only, not a modal it sits in.
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
      close(true);
    } else if (e.key === "Tab") {
      // Back on the field, so Tab carries on from there.
      close(true);
    }
  };

  const option = (item: Item) => {
    const isChosen = chosen?.index === item.index;
    return (
      <li
        key={item.index}
        id={optionId(item.index)}
        data-index={item.index}
        role="option"
        aria-selected={isChosen}
        aria-disabled={item.disabled || undefined}
        onMouseMove={() => !item.disabled && item.index !== active && setActive(item.index)}
        onClick={() => choose(item)}
        className={cx("flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm leading-snug", s.option, item.disabled ? s.disabled : item.index === active && s.active, isChosen && s.selected)}
      >
        <span className="min-w-0 flex-1 break-words">{item.label || " "}</span>
        {isChosen && <FiCheck aria-hidden="true" className={cx("h-4 w-4 shrink-0", s.check)} />}
      </li>
    );
  };

  // Consecutive options of one group sit together under its name.
  const sections: { group: string | null; items: Item[] }[] = [];
  for (const item of shown) {
    const last = sections[sections.length - 1];
    if (last && last.group === item.group) last.items.push(item);
    else sections.push({ group: item.group, items: [item] });
  }

  const activeShown = pickable.some((i) => i.index === active);

  return (
    <div ref={wrapRef} style={style} className={cx("relative inline-block align-top", widthOf(className), className)}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        title={title}
        autoFocus={autoFocus}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required || undefined}
        onClick={() => (open ? close(true) : openList())}
        onKeyDown={onTriggerKey}
        className={cx("flex w-full items-center gap-2 text-left", s.trigger)}
      >
        <span className={cx("min-w-0 flex-1 truncate", !chosen && s.placeholder)}>{chosen ? chosen.label || " " : placeholder || " "}</span>
        <FiChevronDown aria-hidden="true" className={cx("h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none", s.chevron, open && "rotate-180")} />
      </button>

      {/* The form's own select: what it posts and validates. Out of sight and
          out of the tab order; the button above stands for it. */}
      <select
        {...rest}
        ref={selectRef}
        {...(controlled ? { value } : { defaultValue })}
        onChange={(e) => {
          if (!controlled) setOwn(e.target.value);
          onChange?.(e);
        }}
        disabled={disabled}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full opacity-0"
      >
        {children}
      </select>

      {open &&
        place &&
        createPortal(
          <div
            ref={popupRef}
            className={cx("a-menu fixed z-[60] flex flex-col overflow-hidden", s.popup)}
            style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }}
            // Clicks in the list leave the keyboard in the search box.
            onMouseDown={(e) => e.target !== searchRef.current && e.preventDefault()}
          >
            <div className="relative shrink-0 p-2">
              <FiSearch aria-hidden="true" className={cx("pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2", s.searchIcon)} />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(firstMatch(e.target.value));
                }}
                onKeyDown={onSearchKey}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder.replace(/[.…]+$/, "")}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={activeShown ? optionId(active) : undefined}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                // 16px on a phone, or iOS zooms in on it.
                className={cx("w-full text-base sm:text-sm", s.search)}
              />
            </div>
            <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} className={cx("min-h-0 overflow-y-auto overscroll-contain px-1.5 pb-1.5", s.list)}>
              {sections.map((section, si) =>
                section.group === null ? (
                  section.items.map(option)
                ) : (
                  <li key={`g${si}`} role="presentation">
                    <div id={`${uid}-g${si}`} className={cx("px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em]", s.group)}>
                      {section.group}
                    </div>
                    <ul role="group" aria-labelledby={`${uid}-g${si}`}>
                      {section.items.map(option)}
                    </ul>
                  </li>
                )
              )}
            </ul>
            {!shown.length && <p className={cx("px-4 pb-4 pt-1 text-sm", s.empty)}>{noMatches}</p>}
            <p role="status" className="sr-only">
              {term ? (shown.length ? `${pickable.length} ${pickable.length === 1 ? "option" : "options"}` : noMatches) : ""}
            </p>
          </div>,
          document.body
        )}
    </div>
  );
}
