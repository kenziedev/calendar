# 생일·기념일과 캐릭터 스티커

## 사용법

달력 상단 `기념일 → 기념일 추가`에서 이름·날짜·캘린더를 선택한다.

- 생일: 양력 기준으로 매년 표시. 입력한 생년월일 이전에는 표시하지 않는다.
- 기념일: 시작 날짜, 100일·200일·300일 등 100일 단위, 1주년·2주년 등을 표시한다. 100일과 주년은 각각 켜거나 끌 수 있다.
- 100일 계산은 기본적으로 시작일을 1일째로 포함한다. 체크를 끄면 다음 날부터 1일로 계산한다.
- 2월 29일의 생일·주년은 평년에 2월 28일, 윤년에 다시 2월 29일에 표시한다.
- 수정·삭제는 해당 기념일의 모든 반복 표시에 적용된다.
- 월간 달력·목록·날짜 상세·검색·인물 필터·다가오는 함께 일정·공유 일정 조회 도구에 반영된다.

기념일 원본을 별도 D1 테이블에 저장하며 발생 날짜는 화면에서 계산한다. 세션 보호, 수정 버전 검사, 생성 재시도, 삭제 기록 유지, 15초/화면 복귀 갱신을 적용했다. 이미 저장된 생성 ID에 다른 내용을 다시 보내면 충돌을 안내한다.

## 캐릭터 이미지 출처

새 캐릭터 그림 생성은 내장 이미지 생성 도구가 출력 단계에서 `moderation_blocked`로 거절하여 완료하지 못했다. 재시도하거나 대체 생성 도구로 전환하지 않았다. 아래 공식 사이트의 공개 PNG 원본을 변경 없이 저장하고, 화면에서 CSS 흰 테두리·그림자·회전만 적용했다. 새로 생성한 그림이나 소유권을 취득한 그림으로 표시하지 않는다.

| 캐릭터 | 공식 페이지 | 이미지 원본 | 프로젝트 파일 |
| --- | --- | --- | --- |
| 피카츄 | [Pokédex](https://www.pokemon.com/us/pokedex/pikachu) | [025.png](https://assets.pokemon.com/assets/cms2/img/pokedex/full/025.png) | `assets/pikachu-official.png` |
| 파이리 | [Pokédex](https://www.pokemon.com/us/pokedex/charmander) | [004.png](https://assets.pokemon.com/assets/cms2/img/pokedex/full/004.png) | `assets/charmander-official.png` |
| 꼬부기 | [Pokédex](https://www.pokemon.com/us/pokedex/squirtle) | [007.png](https://assets.pokemon.com/assets/cms2/img/pokedex/detail/007.png) | `assets/squirtle-official.png` |
| 커비 | [공식 캐릭터 페이지](https://www.kirby.jp/character/kirby/) | [03.png](https://www.kirby.jp/25th/cms/wp-content/themes/kirby-v2/assets/imgs/character/kirby/03.png) | `assets/kirby-official.png` |

기존 8종과 함께 총 12종을 꾸미기 패널에서 선택할 수 있다. 캐릭터 권리는 각 권리자에게 있다.

## 검증

날짜 계산 13개와 기존 회귀 테스트 17개. 로컬 API 테스트는 인증·입력 검증·생성 재시도·서로 다른 화면의 동시 수정·생일 설정 정규화·삭제 충돌·캐릭터 ID 저장을 확인한다. 운영 주소에서는 쓰기 테스트를 실행하지 않는다.

```text
node --experimental-strip-types --test tests/calendar.test.mjs tests/holidays.test.mjs tests/places.test.mjs tests/anniversaries.test.mjs
node --env-file=.env tests/anniversaries-api.mjs
```
