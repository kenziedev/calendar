# 월간 달력 스티커

날짜마다 8종 중 하나를 붙이고 교체하거나 지울 수 있다. 월간 달력의 `꾸미기`에서 스티커를 고른 뒤 날짜를 누르면 즉시 저장한다. `완료`로 일정 보기로 돌아간다. 스티커는 두 사용자가 공유하며 일정 소유자 필터와 독립적이다.

## 참고한 공개 레퍼런스

- [Hobonichi TSUKI no IRO](https://www.1101.com/store/techo/en/magazine/contents/tsukinoiro/tt_stickerset/): 월간 달력에 맞는 작은 아이콘과 일정 구분 방식.
- [MIDORI Journal Sticker](https://www.midori-japan.co.jp/english/products/journal-sticker/): 날짜·여백에 동물과 사물 모티프를 붙이는 다이어리 꾸밈.
- [Goodnotes editable stickers](https://www.goodnotes.com/blog/editable-stickers-goodnotes-marketplace): 스티커 모음에서 선택하는 간단한 편집 흐름.

레퍼런스 이미지를 복제하지 않고 전용 그림을 생성했다. 흰 테두리와 옅은 그림자, 약간 기울인 배치와 짧은 붙이기 애니메이션을 사용한다. 작은 화면에서는 일정 아래 별도 공간을 확보한다. 움직임 줄이기 설정을 따른다.

## 그림 출처와 생성 프롬프트

- Built-in `image_gen` 생성 모드, 1회 생성, 원본 그대로 사용.
- 최종 파일: `assets/calendar-stickers.png`, 1774 × 887 RGBA PNG.
- 4열 × 2행: 개구리 / 곰 / 체리 / 별, 비행기 / 케이크 / 커피 / 하트.
- CSS background-position으로 각 칸을 표시. 이미지 재편집·자르기 없음.

최종 프롬프트:

```text
Use case: stylized-concept
Asset type: One original transparent PNG sticker sprite sheet for a Korean shared calendar diary-decorating interface.
Primary request: Exactly EIGHT separate cute Korean stationery die-cut scrapbook stickers, arranged in a mathematically strict evenly spaced 4-column by 2-row grid, on one landscape 2:1 canvas. Aim for 2048 x 1024 pixels. Each of the eight equal square cells occupies exactly one quarter of width and one half of height. Invisible cell boundaries: columns at 0%, 25%, 50%, 75%, 100% width; rows at 0%, 50%, 100% height.
Scene/backdrop: Fully transparent background with genuine alpha channel everywhere outside the eight individual stickers. No colored background, no paper sheet, no checkerboard painted into the image.
Subjects and exact order:
Top row, left to right: 1. smiling green frog face; 2. friendly honey-brown bear face; 3. two red cherries joined by green stems; 4. bright golden smiling five-point star.
Bottom row, left to right: 5. blue airplane with a tiny travel flourish; 6. pink birthday cake with one candle; 7. cream coffee mug with a small brown heart; 8. simple coral-red heart.
Style/medium: Cute Korean stationery, clean hand-drawn 2D gouache and delicate pencil texture. Consistent white die-cut rim around each individual sticker, soft very subtle shadow, pleasant saturated pastel accents, dark delicate facial lines. Original designs, clear recognizable silhouette at 28–50 pixels.
Composition/framing: Each sticker is centered precisely in its own equal cell; exact centers are (12.5%,25%), (37.5%,25%), (62.5%,25%), (87.5%,25%), (12.5%,75%), (37.5%,75%), (62.5%,75%), (87.5%,75%). Contain every sticker, all white rim and all shadow, within the central 75% of its cell. Generous completely transparent padding around every sticker. Keep scale visually consistent across all eight. This exact grid will be sliced using CSS, so no sticker may bleed outside its cell, and no extra decorations may appear between cells.
Text: No text, letters, numbers, labels, grid lines, watermark or logo.
Avoid: Extra objects, background props, extra stickers, copyright characters, irregular collage arrangement, any opaque background, any full-sheet border, photorealism, 3D rendering.
```

## 저장과 검증

`day_stickers` D1 테이블에 날짜, 스티커 ID, 변경 버전과 시간을 저장한다. 로그인한 사용자만 읽고 쓸 수 있다. 지운 날짜에도 변경 버전을 남겨 오래된 화면이 삭제 이전 상태를 덮어쓰지 않게 한다. 15초 간격 및 화면 복귀 시 갱신하며 저장 중인 요청과 과거 조회 응답을 구분한다.

로컬 API 검증: `node --env-file=.env tests/stickers-api.mjs`. 운영 주소로는 쓰기 테스트를 실행하지 못하도록 제한했다.
