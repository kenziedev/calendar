# 캐릭터 스티커 추가 모습

2026-09-29: 커비 9종과 피카츄·파이리·꼬부기 각 2종을 추가했다. 기존 스티커 12종을 유지하여 전체 27종(커비 10, 포켓몬 각각 3, 다이어리 8)이다.

꾸미기에서 캐릭터별 분류를 선택한 뒤 그림과 날짜를 누른다. 하단에 실제 선택한 스티커를 계속 보여주며, 종류를 바꾸어도 선택한 브러시는 유지한다. PC는 5열, 모바일은 4열로 표시하며 기존 날짜의 스티커 ID와 저장 방식은 유지한다.

## 원본 출처

공식 페이지에서 실제 사용 중인 투명 PNG를 원본 그대로 저장했다. 이미지 파일을 다시 그리거나 편집하지 않았으며 CSS 흰 테두리·그림자만 적용한다. 기존 4종 출처는 anniversaries-and-characters.md에 기록되어 있다.

| 파일 (assets/)                 | 그림          | 크기    | 공식 페이지                                             | 원본                                                                                               |
| ------------------------------ | ------------- | ------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| kirby-rest-official.png        | 쉬는 커비     | 365×270 | [출처](https://www.kirby.jp/character/kirby/)           | [PNG](https://www.kirby.jp/25th/cms/wp-content/themes/kirby-v2/assets/imgs/character/kirby/04.png) |
| kirby-star-official.png        | 별 타는 커비  | 454×469 | [출처](https://kirby.nintendo.com/)                     | [PNG](https://kirby.nintendo.com/assets/img/intro/kirby-star2.png)                                 |
| kirby-puffy-official.png       | 둥실 커비     | 493×459 | [출처](https://kirby.nintendo.com/)                     | [PNG](https://kirby.nintendo.com/assets/img/home/kirby-puffy.png)                                  |
| kirby-fighter-official.png     | 파이터 커비   | 733×587 | [출처](https://kirby.nintendo.com/)                     | [PNG](https://kirby.nintendo.com/assets/img/home/kirby-powerful.png)                               |
| kirby-jump-official.png        | 폴짝 커비     | 334×416 | [출처](https://kirby.nintendo.com/)                     | [PNG](https://kirby.nintendo.com/assets/img/kirby-jump.png)                                        |
| kirby-swim-official.png        | 물놀이 커비   | 417×352 | [출처](https://kirby.nintendo.com/about/)               | [PNG](https://kirby.nintendo.com/assets/img/about/char-kirby.png)                                  |
| kirby-sleep-official.png       | 잠자는 커비   | 466×350 | [출처](https://www.kirby.jp/character/kirby/)           | [PNG](https://www.kirby.jp/25th/cms/wp-content/themes/kirby-v2/assets/imgs/character/kirby/13.png) |
| kirby-mirror-official.png      | 미러 커비     | 547×524 | [출처](https://www.kirby.jp/character/kirby/)           | [PNG](https://www.kirby.jp/25th/cms/wp-content/themes/kirby-v2/assets/imgs/character/kirby/10.png) |
| kirby-ranger-official.png      | 레인저 커비   | 552×386 | [출처](https://www.kirby.jp/character/kirby/)           | [PNG](https://www.kirby.jp/25th/cms/wp-content/themes/kirby-v2/assets/imgs/character/kirby/08.png) |
| pikachu-cafe-official.png      | 피카츄 카페   | 763×650 | [출처](https://cafemix.pokemon.com/en-us/)              | [PNG](https://cafemix.pokemon.com/assets/images/home/cafe/pokemon/pikachu.png)                     |
| charmander-cafe-official.png   | 파이리 카페   | 763×650 | [출처](https://cafemix.pokemon.com/en-us/)              | [PNG](https://cafemix.pokemon.com/assets/images/home/cafe/pokemon/charmander.png)                  |
| squirtle-cafe-official.png     | 꼬부기 카페   | 763×650 | [출처](https://cafemix.pokemon.com/en-us/)              | [PNG](https://cafemix.pokemon.com/assets/images/home/cafe/pokemon/squirtle.png)                    |
| pikachu-rescue-official.png    | 피카츄 구조대 | 420×420 | [출처](https://mysterydungeon.pokemon.com/en-us/world/) | [PNG](https://mysterydungeon.pokemon.com/assets/images/world/characters/Pikachu.png)               |
| charmander-rescue-official.png | 파이리 구조대 | 420×420 | [출처](https://mysterydungeon.pokemon.com/en-us/world/) | [PNG](https://mysterydungeon.pokemon.com/assets/images/world/characters/Charmander.png)            |
| squirtle-rescue-official.png   | 꼬부기 구조대 | 420×420 | [출처](https://mysterydungeon.pokemon.com/en-us/world/) | [PNG](https://mysterydungeon.pokemon.com/assets/images/world/characters/Squirtle.png)              |

## 검증

- 타입 검사로 캐릭터 ID에 대응하는 이미지 누락 검사.
- 기존 API 인증·입력·충돌·삭제 검증에 더해 15종 모두 저장 후 다른 로그인 세션에서 재조회. 검증용 로컬 스티커와 세션 정리.
- PC·모바일에서 분류 전환, 스티커 선택·날짜에 붙이기·새로고침 유지·지우기 확인.
- 서버와 GitHub Pages 화면을 함께 배포하며 서버를 먼저 갱신하여 새 ID를 허용한다.
- 스티커 구성·선택창·API 테스트 파일의 정적 코드 검사는 통과했다. 전체 달력 파일에는 이번 수정 전과 동일한 React 훅 관련 오류 5개·경고 3개가 있으며 원본과 비교해 기존 지적임을 확인했다. 이번 변경은 해당 상태 처리와 무관하다.
