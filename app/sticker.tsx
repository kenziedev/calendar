import { useState } from "react";
import { Check, Eraser } from "lucide-react";
import stickerSheet from "../assets/calendar-stickers.png";
import pikachu from "../assets/pikachu-official.png";
import charmander from "../assets/charmander-official.png";
import squirtle from "../assets/squirtle-official.png";
import kirby from "../assets/kirby-official.png";
import kirbyRest from "../assets/kirby-rest-official.png";
import kirbyStar from "../assets/kirby-star-official.png";
import kirbyPuffy from "../assets/kirby-puffy-official.png";
import kirbyFighter from "../assets/kirby-fighter-official.png";
import kirbyJump from "../assets/kirby-jump-official.png";
import kirbySwim from "../assets/kirby-swim-official.png";
import kirbySleep from "../assets/kirby-sleep-official.png";
import kirbyMirror from "../assets/kirby-mirror-official.png";
import kirbyRanger from "../assets/kirby-ranger-official.png";
import pikachuCafe from "../assets/pikachu-cafe-official.png";
import pikachuRescue from "../assets/pikachu-rescue-official.png";
import charmanderCafe from "../assets/charmander-cafe-official.png";
import charmanderRescue from "../assets/charmander-rescue-official.png";
import squirtleCafe from "../assets/squirtle-cafe-official.png";
import squirtleRescue from "../assets/squirtle-rescue-official.png";
import {
  STICKERS,
  STICKER_COLLECTIONS,
  stickerName,
  type StickerCollection,
  type StickerId,
  type CharacterStickerId,
} from "../lib/stickers";
const characterImages = {
  pikachu,
  charmander,
  squirtle,
  kirby,
  "kirby-rest": kirbyRest,
  "kirby-star": kirbyStar,
  "kirby-puffy": kirbyPuffy,
  "kirby-fighter": kirbyFighter,
  "kirby-jump": kirbyJump,
  "kirby-swim": kirbySwim,
  "kirby-sleep": kirbySleep,
  "kirby-mirror": kirbyMirror,
  "kirby-ranger": kirbyRanger,
  "pikachu-cafe": pikachuCafe,
  "pikachu-rescue": pikachuRescue,
  "charmander-cafe": charmanderCafe,
  "charmander-rescue": charmanderRescue,
  "squirtle-cafe": squirtleCafe,
  "squirtle-rescue": squirtleRescue,
} satisfies Record<CharacterStickerId, typeof kirby>;

export function Sticker({
  id,
  className = "",
}: {
  id: StickerId;
  className?: string;
}) {
  const sticker = STICKERS.find((s) => s.id === id);
  if (!sticker) return null;
  const character =
    sticker.collection === "diary" ? null : characterImages[sticker.id];
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
  const [collection, setCollection] = useState<StickerCollection>(
    () => STICKERS.find((s) => s.id === brush)?.collection ?? "kirby",
  );
  const visibleStickers = STICKERS.filter((s) => s.collection === collection);
  const collectionName = STICKER_COLLECTIONS.find(
    (c) => c.id === collection,
  )!.name;
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
      <div
        className="sticker-collections"
        role="group"
        aria-label="스티커 종류"
      >
        {STICKER_COLLECTIONS.map((c) => (
          <button
            key={c.id}
            className={collection === c.id ? "active" : ""}
            aria-pressed={collection === c.id}
            aria-controls="sticker-options"
            onClick={() => setCollection(c.id)}
          >
            {c.name}
            <span>{STICKERS.filter((s) => s.collection === c.id).length}</span>
          </button>
        ))}
      </div>
      <div
        key={collection}
        className={`sticker-collection ${collection === "pokemon" ? "pokemon-collection" : ""}`}
      >
        <div
          id="sticker-options"
          className="sticker-options"
          role="group"
          aria-label={`${collectionName} 스티커`}
        >
          {visibleStickers.map((s) => (
            <button
              key={s.id}
              className={`sticker-option ${brush === s.id ? "chosen" : ""}`}
              aria-label={`${stickerName(s.id)} 스티커`}
              aria-pressed={brush === s.id}
              onClick={() => onBrush(s.id)}
            >
              <Sticker id={s.id} />
              {s.collection === "pokemon" ? (
                <span className="pokemon-sticker-label">
                  {s.name}
                  <small>{s.label}</small>
                </span>
              ) : (
                <span>{s.label}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="sticker-tray-footer">
        <span role="status">
          {saving ? (
            "스티커 저장하는 중…"
          ) : !loaded ? (
            "스티커 불러오는 중…"
          ) : brush === null ? (
            "지울 날짜를 눌러주세요."
          ) : (
            <>
              <Sticker id={brush} className="sticker-brush-preview" />
              {stickerName(brush)}
            </>
          )}
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
