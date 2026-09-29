import { Check, Eraser } from "lucide-react";
import stickerSheet from "../assets/calendar-stickers.png";
import { STICKERS, type StickerId } from "../lib/stickers";

export function Sticker({
  id,
  className = "",
}: {
  id: StickerId;
  className?: string;
}) {
  const sticker = STICKERS.find((s) => s.id === id);
  if (!sticker) return null;
  return (
    <span
      aria-hidden="true"
      className={`sticker-art ${className}`}
      style={{
        backgroundImage: `url(${typeof stickerSheet === "string" ? stickerSheet : stickerSheet.src})`,
        backgroundPosition: `${(sticker.x * 100) / 3}% ${sticker.y * 100}%`,
      }}
    />
  );
}
export function StickerTray({
  brush,
  onBrush,
  onClose,
  saving,
  loaded,
}: {
  brush: StickerId | null;
  onBrush: (id: StickerId | null) => void;
  onClose: () => void;
  saving: boolean;
  loaded: boolean;
}) {
  return (
    <div className="sticker-tray" id="sticker-tray">
      <div className="sticker-tray-heading">
        <div>
          <strong>스티커 고르기</strong>
          <p>고른 다음, 달력의 날짜를 눌러보세요.</p>
        </div>
        <button className="sticker-done" onClick={onClose}>
          <Check size={15} />
          완료
        </button>
      </div>
      <div className="sticker-options" role="group" aria-label="스티커 종류">
        {STICKERS.map((s) => (
          <button
            key={s.id}
            className={`sticker-option ${brush === s.id ? "chosen" : ""}`}
            aria-label={`${s.name} 스티커`}
            aria-pressed={brush === s.id}
            onClick={() => onBrush(s.id)}
          >
            <Sticker id={s.id} />
            <span>{s.name}</span>
          </button>
        ))}
      </div>
      <div className="sticker-tray-footer">
        <span role="status">
          {saving
            ? "스티커 저장하는 중…"
            : !loaded
              ? "스티커 불러오는 중…"
              : brush === null
                ? "지울 날짜를 눌러주세요."
                : "하루에 하나씩 · 함께 보는 꾸밈"}
        </span>
        <button
          className={`sticker-eraser ${brush === null ? "chosen" : ""}`}
          aria-pressed={brush === null}
          onClick={() => onBrush(null)}
        >
          <Eraser size={16} />
          지우개
        </button>
      </div>
    </div>
  );
}
