import { Check, Eraser } from "lucide-react";
import stickerSheet from "../assets/calendar-stickers.png";
import pikachu from "../assets/pikachu-official.png";
import charmander from "../assets/charmander-official.png";
import squirtle from "../assets/squirtle-official.png";
import kirby from "../assets/kirby-official.png";
import { STICKERS, type StickerId } from "../lib/stickers";
const characterImages = { pikachu, charmander, squirtle, kirby };

export function Sticker({
  id,
  className = "",
}: {
  id: StickerId;
  className?: string;
}) {
  const sticker = STICKERS.find((s) => s.id === id);
  if (!sticker) return null;
  const character = characterImages[id as keyof typeof characterImages];
  const picture = character || stickerSheet;
  return (
    <span
      aria-hidden="true"
      className={`sticker-art ${character ? "character-art" : ""} ${className}`}
      style={{
        backgroundImage: `url(${typeof picture === "string" ? picture : picture.src})`,
        backgroundSize: character ? "contain" : "400% 200%",
        backgroundPosition: character
          ? "center"
          : `${(sticker.x * 100) / 3}% ${sticker.y * 100}%`,
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
      {[
        ["캐릭터", STICKERS.slice(8)],
        ["다이어리", STICKERS.slice(0, 8)],
      ].map(([label, collection]) => (
        <div className="sticker-collection" key={label as string}>
          <p>{label as string}</p>
          <div
            className="sticker-options"
            role="group"
            aria-label={`${label} 스티커`}
          >
            {(collection as (typeof STICKERS)[number][]).map((s) => (
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
        </div>
      ))}
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
