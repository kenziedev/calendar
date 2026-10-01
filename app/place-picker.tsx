"use client";
import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Search, LoaderCircle, Pencil, Check } from "lucide-react";
import type { PlaceResult, PlaceSearch } from "../lib/places";
import { placeDisplay } from "../lib/maps";

export default function PlacePicker({
  value,
  onChange,
  onSelect,
  search,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  search: (query: string, signal: AbortSignal) => Promise<PlaceSearch>;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);
  const nextFocus = useRef<"input" | "change" | null>(null);
  const [editing, setEditing] = useState(!value.trim());
  const pending = useRef<AbortController | null>(null);
  const [focused, setFocused] = useState(false);
  const [composing, setComposing] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [active, setActive] = useState(-1);
  const [phase, setPhase] = useState<
    "idle" | "loading" | "ready" | "error" | "unavailable"
  >("idle");
  const [searchAttempt, setSearchAttempt] = useState(0);
  const query = value.trim();
  const display = placeDisplay(value);
  useEffect(() => {
    if (nextFocus.current === "input") {
      input.current?.focus();
      input.current?.select();
    } else if (nextFocus.current === "change") changeButton.current?.focus();
    nextFocus.current = null;
  }, [editing]);
  const eligible =
    editing &&
    focused &&
    !dismissed &&
    !composing &&
    query.length >= 2 &&
    query.length <= 120 &&
    !/^https?:\/\//i.test(query);
  useEffect(() => {
    setResults([]);
    setActive(-1);
    if (!eligible) {
      setPhase("idle");
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setPhase("loading");
    const timer = setTimeout(async () => {
      try {
        const response = await search(query, controller.signal);
        if (controller.signal.aborted) return;
        setResults(response.places);
        setPhase(response.enabled ? "ready" : "unavailable");
      } catch {
        if (!controller.signal.aborted) setPhase("error");
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
      if (pending.current === controller) pending.current = null;
    };
  }, [eligible, query, search, searchAttempt]);

  const show = eligible;
  const retry = () => {
    pending.current?.abort();
    setDismissed(false);
    setSearchAttempt((attempt) => attempt + 1);
    input.current?.focus();
  };
  const select = (place: PlaceResult) => {
    pending.current?.abort();
    onSelect(place);
    setDismissed(true);
    setResults([]);
    setFocused(false);
    nextFocus.current = "change";
    setEditing(false);
  };
  return (
    <div
      className="place-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          pending.current?.abort();
          setFocused(false);
        }
      }}
    >
      <div className="place-field-heading">
        <label id={`${id}-label`} htmlFor={editing ? id : undefined}>
          <MapPin size={17} />
          장소
        </label>
        {!editing && (
          <button
            ref={changeButton}
            type="button"
            className="place-edit"
            onClick={() => {
              nextFocus.current = "input";
              setEditing(true);
            }}
          >
            <Pencil size={14} />
            장소 변경
          </button>
        )}
      </div>
      {editing ? (
        <>
          <input
            className="place-input"
            id={id}
            ref={input}
            role="combobox"
            autoComplete="off"
            placeholder="장소명·주소 검색 또는 지도 링크"
            maxLength={200}
            value={value}
            aria-autocomplete="list"
            aria-expanded={show && results.length > 0}
            aria-controls={show && results.length ? `${id}-results` : undefined}
            aria-activedescendant={
              show && results[active] ? `${id}-option-${active}` : undefined
            }
            aria-describedby={`${id}-hint`}
            onChange={(event) => {
              // Whitespace-only edits keep the request/results for the same query.
              if (event.target.value.trim() !== query) {
                pending.current?.abort();
                setActive(-1);
                setResults([]);
              }
              onChange(event.target.value);
              setDismissed(false);
            }}
            onFocus={() => setFocused(true)}
            onCompositionStart={() => {
              pending.current?.abort();
              setComposing(true);
            }}
            onCompositionEnd={() => setComposing(false)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Escape" && !dismissed) {
                event.preventDefault();
                event.stopPropagation();
                pending.current?.abort();
                setDismissed(true);
              } else if (show && event.key === "ArrowDown") {
                event.preventDefault();
                setActive((index) => Math.min(index + 1, results.length - 1));
              } else if (show && event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (show && results[active]) select(results[active]);
                else retry();
              }
            }}
          />
          <div className="place-input-help">
            <p id={`${id}-hint`} className="place-hint">
              검색 결과를 선택하거나 직접 입력해 주세요.
            </p>
            {value.trim() && (
              <button
                type="button"
                className="place-edit place-finish"
                onClick={() => {
                  pending.current?.abort();
                  setDismissed(true);
                  nextFocus.current = "change";
                  setEditing(false);
                }}
              >
                <Check size={14} />
                입력 완료
              </button>
            )}
          </div>
        </>
      ) : (
        <div
          className="place-selected"
          role="group"
          aria-labelledby={`${id}-label`}
        >
          <span className="place-selected-icon">
            <MapPin size={19} />
          </span>
          <div className="place-selected-copy">
            <strong>{display.name}</strong>
            {display.address && <span>{display.address}</span>}
          </div>
        </div>
      )}
      {show && (
        <div className="place-search-panel">
          <div className="place-search-heading">
            <Search size={14} />
            네이버 장소 검색
          </div>
          {phase === "loading" && (
            <p role="status">
              <LoaderCircle size={14} className="spin" />
              검색 중…
            </p>
          )}
          {phase === "unavailable" && (
            <p role="status">
              장소 검색이 아직 연결되지 않았습니다. 장소를 직접 입력하거나 지도
              링크를 붙여 넣을 수 있습니다.
            </p>
          )}
          {phase === "error" && (
            <p role="status">
              검색에 연결하지 못했습니다. 다시 입력하거나 장소를 직접 등록해
              주세요.
            </p>
          )}
          {phase === "ready" && !results.length && (
            <p role="status">
              검색 결과가 없습니다. 지역명과 장소명을 함께 입력해 보세요.
            </p>
          )}
          {(phase === "error" ||
            phase === "unavailable" ||
            (phase === "ready" && !results.length)) && (
            <button
              type="button"
              className="place-edit place-retry"
              onClick={retry}
            >
              <Search size={14} /> 다시 검색
            </button>
          )}
          {results.length > 0 && (
            <ul
              id={`${id}-results`}
              role="listbox"
              aria-label="네이버 장소 검색 결과"
            >
              {results.map((place, index) => (
                <li key={place.location} role="presentation">
                  <button
                    id={`${id}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={active === index}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(place)}
                    onFocus={() => setActive(index)}
                  >
                    <strong>{place.name}</strong>
                    <span>{place.address}</span>
                    <small>{place.category}</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
