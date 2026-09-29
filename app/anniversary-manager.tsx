"use client";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Cake,
  Gift,
  Plus,
  X,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Check,
} from "lucide-react";
import { addDays, PEOPLE, shortDate } from "../lib/calendar";
import {
  anniversaryOccurrences,
  newAnniversary,
  type Anniversary,
  type AnniversaryOccurrence,
} from "../lib/anniversaries";
import type { useAnniversaries } from "./use-anniversaries";

export function AnniversaryCard({
  item,
  onEdit,
}: {
  item: AnniversaryOccurrence;
  onEdit: (a: Anniversary) => void;
}) {
  const Icon = item.anniversary.kind === "birthday" ? Cake : Gift;
  return (
    <button
      className="anniversary-card"
      onClick={() => onEdit(item.anniversary)}
    >
      <span className="anniversary-icon">
        <Icon size={19} />
      </span>
      <span>
        <small>
          {item.label} · {PEOPLE[item.anniversary.owner].name}
        </small>
        <strong>{item.title}</strong>
      </span>
      <ChevronRight size={15} />
    </button>
  );
}
export default function AnniversaryManager({
  initialRecord,
  defaultDate,
  currentDay,
  store,
  onClose,
}: {
  initialRecord: Anniversary | null;
  defaultDate: string;
  currentDay: string;
  store: ReturnType<typeof useAnniversaries>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [editing, setEditing] = useState<Anniversary | null>(initialRecord);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notice, setNotice] = useState("");
  const [localError, setLocalError] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    if (editing)
      dialog.current
        ?.querySelector<HTMLInputElement>("#anniversary-title")
        ?.focus();
  }, [editing?.id, !!editing]);
  const preview = useMemo(
    () =>
      editing?.startDate
        ? anniversaryOccurrences([editing], editing.startDate, "2100-12-31")
            .filter((o) => o.label !== "시작일")
            .slice(0, 4)
        : [],
    [editing],
  );
  function edit(a: Anniversary) {
    setEditing({ ...a });
    setConfirmDelete(false);
    setNotice("");
    setLocalError("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    if (editing.kind === "anniversary" && !editing.yearly && !editing.each100) {
      setLocalError("주년 또는 100일 표시를 하나 이상 선택해 주세요.");
      return;
    }
    if (await store.mutate(editing)) {
      setEditing(null);
      setNotice("기념일을 저장했어요.");
    }
  }
  async function remove() {
    if (editing && (await store.mutate(editing, true))) {
      setEditing(null);
      setConfirmDelete(false);
      setNotice("기념일을 삭제했어요.");
    }
  }
  function update(patch: Partial<Anniversary>) {
    setEditing((a) => (a ? { ...a, ...patch } : a));
    setLocalError("");
  }
  return (
    <dialog
      ref={dialog}
      className="anniversary-dialog"
      aria-labelledby="anniversary-heading"
      onCancel={(e) => {
        if (store.saving) e.preventDefault();
        else onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current && !store.saving) onClose();
      }}
    >
      <div className="anniversary-dialog-inner">
        <div className="anniversary-heading">
          <div>
            <p>생일 · 100일 · 주년</p>
            <h2 id="anniversary-heading">
              {editing ? (editing.id ? "기념일 수정" : "새 기념일") : "기념일"}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="기념일 창 닫기"
            onClick={onClose}
            disabled={store.saving}
          >
            <X size={21} />
          </button>
        </div>
        {store.error && (
          <div className="anniversary-error" role="alert">
            {store.error}
            <button onClick={() => void store.refresh()}>새로고침</button>
          </div>
        )}
        {notice && (
          <p className="anniversary-notice" role="status">
            {notice}
          </p>
        )}
        {editing ? (
          <form onSubmit={save}>
            <fieldset disabled={store.saving} className="anniversary-fields">
              <button
                className="anniversary-back"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setConfirmDelete(false);
                }}
              >
                <ArrowLeft size={15} />
                기념일 목록
              </button>
              <div
                className="anniversary-kind"
                role="group"
                aria-label="기념일 종류"
              >
                <button
                  type="button"
                  aria-pressed={editing.kind === "birthday"}
                  onClick={() =>
                    update({ kind: "birthday", yearly: true, each100: false })
                  }
                >
                  <Cake size={18} />
                  생일
                </button>
                <button
                  type="button"
                  aria-pressed={editing.kind === "anniversary"}
                  onClick={() =>
                    update({ kind: "anniversary", yearly: true, each100: true })
                  }
                >
                  <Gift size={18} />
                  기념일
                </button>
              </div>
              <label className="anniversary-field" htmlFor="anniversary-title">
                {editing.kind === "birthday"
                  ? "이름 또는 생일 제목"
                  : "기념일 이름"}
                <input
                  id="anniversary-title"
                  required
                  maxLength={60}
                  placeholder={
                    editing.kind === "birthday"
                      ? "예: 현쪼기"
                      : "예: 처음 만난 날"
                  }
                  value={editing.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </label>
              <div className="anniversary-field-row">
                <label className="anniversary-field">
                  {editing.kind === "birthday" ? "생년월일" : "시작 날짜"}
                  <input
                    type="date"
                    required
                    min="1900-01-01"
                    max="2100-12-31"
                    value={editing.startDate}
                    onChange={(e) => update({ startDate: e.target.value })}
                  />
                </label>
                <label className="anniversary-field">
                  캘린더
                  <select
                    value={editing.owner}
                    onChange={(e) =>
                      update({ owner: e.target.value as Anniversary["owner"] })
                    }
                  >
                    {Object.entries(PEOPLE).map(([id, p]) => (
                      <option key={id} value={id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {editing.kind === "birthday" ? (
                <p className="anniversary-help">
                  매년 같은 날짜에 생일이 표시됩니다. 양력 기준이에요.
                </p>
              ) : (
                <div className="anniversary-rules">
                  <label>
                    <input
                      type="checkbox"
                      checked={editing.each100}
                      onChange={(e) => update({ each100: e.target.checked })}
                    />
                    <span>
                      <strong>100일마다 표시</strong>
                      <small>100일, 200일, 300일…</small>
                    </span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={editing.yearly}
                      onChange={(e) => update({ yearly: e.target.checked })}
                    />
                    <span>
                      <strong>매년 주년 표시</strong>
                      <small>1주년, 2주년, 3주년…</small>
                    </span>
                  </label>
                  {editing.each100 && (
                    <label className="day-count-option">
                      <input
                        type="checkbox"
                        checked={editing.countFromOne}
                        onChange={(e) =>
                          update({ countFromOne: e.target.checked })
                        }
                      />
                      <span>시작일을 1일째로 계산</span>
                    </label>
                  )}
                  {editing.each100 && (
                    <p className="anniversary-help">
                      {editing.countFromOne
                        ? "시작 날짜를 포함해서 날짜를 셉니다."
                        : "시작 날짜의 다음 날부터 1일로 셉니다."}
                    </p>
                  )}
                </div>
              )}
              {editing.startDate.endsWith("02-29") && (
                <p className="anniversary-help">
                  2월 29일은 평년에 2월 28일로 표시합니다.
                </p>
              )}
              {preview.length > 0 && (
                <div className="anniversary-preview">
                  <strong>달력 표시 예시</strong>
                  {preview.map((o) => (
                    <div key={o.key}>
                      <span>{o.date.replaceAll("-", ". ")}</span>
                      <b>{o.label}</b>
                    </div>
                  ))}
                </div>
              )}
              {editing.id && (
                <p className="anniversary-help">
                  수정·삭제하면 이 기념일의 모든 반복 표시에 적용됩니다.
                </p>
              )}
              {localError && (
                <p className="error-text" role="alert">
                  {localError}
                </p>
              )}
              {confirmDelete ? (
                <div className="delete-confirm" role="alert">
                  <p>이 기념일의 모든 반복 표시를 삭제할까요?</p>
                  <button type="button" onClick={() => setConfirmDelete(false)}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => void remove()}
                  >
                    삭제하기
                  </button>
                </div>
              ) : (
                <div className="anniversary-form-footer">
                  {editing.id && (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 size={16} />
                      삭제
                    </button>
                  )}
                  <button
                    className="primary"
                    disabled={!store.loaded || store.saving}
                  >
                    <Check size={16} />
                    {store.saving ? "저장 중…" : "저장하기"}
                  </button>
                </div>
              )}
            </fieldset>
          </form>
        ) : (
          <>
            <div className="anniversary-list-intro">
              <p>한 번 등록하면 달력에 자동으로 표시돼요.</p>
              <button
                className="primary"
                disabled={!store.loaded}
                onClick={() => edit(newAnniversary(defaultDate))}
              >
                <Plus size={16} />
                기념일 추가
              </button>
            </div>
            {!store.loaded ? (
              <p className="anniversary-empty">기념일을 불러오는 중…</p>
            ) : store.rows.length ? (
              <div className="anniversary-list">
                {[...store.rows]
                  .sort((a, b) => a.startDate.localeCompare(b.startDate))
                  .map((a) => {
                    const next = anniversaryOccurrences(
                      [a],
                      currentDay,
                      addDays(currentDay, 400),
                    ).slice(0, 2);
                    const Icon = a.kind === "birthday" ? Cake : Gift;
                    return (
                      <button
                        key={a.id}
                        onClick={() => edit(a)}
                        className="anniversary-list-item"
                      >
                        <span className="anniversary-icon">
                          <Icon size={20} />
                        </span>
                        <span>
                          <strong>{a.title}</strong>
                          <small>
                            {a.kind === "birthday" ? "생일" : "기념일"} ·{" "}
                            {PEOPLE[a.owner].name} ·{" "}
                            {a.startDate.replaceAll("-", ". ")}
                          </small>
                          <em>
                            {next.length
                              ? next
                                  .map(
                                    (o) =>
                                      `${o.date.slice(0, 4)}년 ${shortDate(o.date)} ${o.label}`,
                                  )
                                  .join(" · ")
                              : "예정된 표시가 없습니다"}
                          </em>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    );
                  })}
              </div>
            ) : (
              <div className="anniversary-empty">
                <Gift size={32} />
                <strong>등록된 기념일이 없어요</strong>
                <p>생일이나 시작 날짜를 추가해 보세요.</p>
              </div>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
