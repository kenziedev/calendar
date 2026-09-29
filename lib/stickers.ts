export const STICKER_COLLECTIONS = [
  { id: "kirby", name: "커비" },
  { id: "pikachu", name: "피카츄" },
  { id: "charmander", name: "파이리" },
  { id: "squirtle", name: "꼬부기" },
  { id: "diary", name: "다이어리" },
] as const;
export type StickerCollection = (typeof STICKER_COLLECTIONS)[number]["id"];
type StickerDefinition = {
  id: string;
  name: string;
  label: string;
  collection: StickerCollection;
  x: number;
  y: number;
};
export const STICKERS = [
  {
    id: "frog",
    name: "개구리",
    label: "개구리",
    collection: "diary",
    x: 0,
    y: 0,
  },
  { id: "bear", name: "곰", label: "곰", collection: "diary", x: 1, y: 0 },
  {
    id: "cherries",
    name: "체리",
    label: "체리",
    collection: "diary",
    x: 2,
    y: 0,
  },
  { id: "star", name: "별", label: "별", collection: "diary", x: 3, y: 0 },
  {
    id: "airplane",
    name: "비행기",
    label: "비행기",
    collection: "diary",
    x: 0,
    y: 1,
  },
  {
    id: "cake",
    name: "케이크",
    label: "케이크",
    collection: "diary",
    x: 1,
    y: 1,
  },
  {
    id: "coffee",
    name: "커피",
    label: "커피",
    collection: "diary",
    x: 2,
    y: 1,
  },
  { id: "heart", name: "하트", label: "하트", collection: "diary", x: 3, y: 1 },
  {
    id: "pikachu",
    name: "피카츄",
    label: "안녕!",
    collection: "pikachu",
    x: 0,
    y: 0,
  },
  {
    id: "charmander",
    name: "파이리",
    label: "반가워",
    collection: "charmander",
    x: 0,
    y: 0,
  },
  {
    id: "squirtle",
    name: "꼬부기",
    label: "준비 완료",
    collection: "squirtle",
    x: 0,
    y: 0,
  },
  {
    id: "kirby",
    name: "커비",
    label: "신나!",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-rest",
    name: "커비",
    label: "쉬는 중",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-star",
    name: "커비",
    label: "별 타기",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-puffy",
    name: "커비",
    label: "둥실둥실",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-fighter",
    name: "커비",
    label: "파이터",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-jump",
    name: "커비",
    label: "폴짝!",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-swim",
    name: "커비",
    label: "물놀이",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-sleep",
    name: "커비",
    label: "쿨쿨",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-mirror",
    name: "커비",
    label: "미러",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "kirby-ranger",
    name: "커비",
    label: "레인저",
    collection: "kirby",
    x: 0,
    y: 0,
  },
  {
    id: "pikachu-cafe",
    name: "피카츄",
    label: "카페",
    collection: "pikachu",
    x: 0,
    y: 0,
  },
  {
    id: "pikachu-rescue",
    name: "피카츄",
    label: "탐험대",
    collection: "pikachu",
    x: 0,
    y: 0,
  },
  {
    id: "charmander-cafe",
    name: "파이리",
    label: "카페",
    collection: "charmander",
    x: 0,
    y: 0,
  },
  {
    id: "charmander-rescue",
    name: "파이리",
    label: "탐험대",
    collection: "charmander",
    x: 0,
    y: 0,
  },
  {
    id: "squirtle-cafe",
    name: "꼬부기",
    label: "카페",
    collection: "squirtle",
    x: 0,
    y: 0,
  },
  {
    id: "squirtle-rescue",
    name: "꼬부기",
    label: "탐험대",
    collection: "squirtle",
    x: 0,
    y: 0,
  },
] as const satisfies readonly StickerDefinition[];
export type StickerId = (typeof STICKERS)[number]["id"];
export function stickerName(id: StickerId | null) {
  const sticker = STICKERS.find((s) => s.id === id);
  if (!sticker) return "";
  return sticker.name === sticker.label
    ? sticker.name
    : `${sticker.name} ${sticker.label}`;
}
export type CharacterStickerId = Exclude<
  (typeof STICKERS)[number],
  { collection: "diary" }
>["id"];
export type DaySticker = {
  date: string;
  stickerId: StickerId | null;
  version: number;
};
export type StickerResponse = { stickers: DaySticker[]; sticker: DaySticker };
