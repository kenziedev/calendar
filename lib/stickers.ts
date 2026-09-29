export const STICKERS = [
  { id: "frog", name: "개구리", x: 0, y: 0 },
  { id: "bear", name: "곰", x: 1, y: 0 },
  { id: "cherries", name: "체리", x: 2, y: 0 },
  { id: "star", name: "별", x: 3, y: 0 },
  { id: "airplane", name: "비행기", x: 0, y: 1 },
  { id: "cake", name: "케이크", x: 1, y: 1 },
  { id: "coffee", name: "커피", x: 2, y: 1 },
  { id: "heart", name: "하트", x: 3, y: 1 },
  { id: "pikachu", name: "피카츄", x: 0, y: 0 },
  { id: "charmander", name: "파이리", x: 0, y: 0 },
  { id: "squirtle", name: "꼬부기", x: 0, y: 0 },
  { id: "kirby", name: "커비", x: 0, y: 0 },
] as const;
export type StickerId = (typeof STICKERS)[number]["id"];
export type DaySticker = {
  date: string;
  stickerId: StickerId | null;
  version: number;
};
export type StickerResponse = { stickers: DaySticker[]; sticker: DaySticker };
