# 공유 캘린더

현쪼기·쩡개굴의 공유 캘린더. 기본 접근 주소는 **https://kenzie.kr/cal/** 입니다.

## 기능

- 월 달력·일정 목록, 오늘 이동, 날짜 선택, 제목·장소·메모 검색
- 현쪼기(파랑), 쩡개굴(초록), 함께(분홍) 캘린더와 표시 필터
- 일정 생성·수정·삭제, 종일·시간·기간 일정, 장소·메모
- 매일·매주·매월·매년 반복과 종료일 (반복 수정·삭제는 전체 시리즈)
- 비밀번호 인증, 기기별 세션, 잠금, 로그인 시도 제한
- 서버 공유 저장, 15초마다/화면 복귀 시 새로고침, 동시 수정 충돌 방지
- PC·모바일 대응, 서울 시간 기준, 키보드·스크린리더 지원
- 토요일 파란색, 일요일·공휴일 빨간색, 공휴일 이름과 목록 표시

## 공휴일 자료

[holidays-kr](https://holidays.hyunbin.page)의 대한민국 공휴일 자료를 사용합니다. 월력요항을 가공한 공개 데이터이며, 정부 API와 직접 연동하지는 않습니다. 임시공휴일·대체공휴일은 제공처 자료에 추가되면 반영됩니다.

인증된 조회 시 서버가 6시간 간격으로 최신 자료를 확인하고, 화면은 10분마다 또는 화면 복귀·새로고침 시 다시 가져옵니다. ETag로 변경 여부를 확인하며, 추가뿐 아니라 취소된 공휴일도 최신 자료에 맞춥니다. 제공처 장애 시 마지막 정상 자료를 유지하고 갱신 지연을 표시하며 15분 뒤 재시도합니다. 최초 조회 실패는 자료 확인 필요 상태로 표시합니다.

2026-09-14 확인 기준 자료 범위는 2018–2027년입니다. 범위 밖 연도는 미제공 안내를 표시하며, 제공처가 다음 연도를 추가하면 별도 배포 없이 확장됩니다. 일정 필터와 관계없이 공휴일은 표시됩니다.

## 구성

같은 React 화면을 두 환경에 빌드합니다.

1. GitHub Pages의 기존 블로그에 `/cal/` 정적 화면을 추가합니다. `static/` → `static-dist/`.
2. Sites의 Cloudflare Worker가 인증·일정 API를 제공하고 D1에 저장합니다. `app/api/`, `lib/server.ts`, `db/schema.ts`.
3. Pages 화면은 허용된 HTTPS API로 요청하며, 비밀번호가 맞으면 발급되는 임의 세션 토큰을 사용합니다. 제3자 쿠키가 필요하지 않아 Safari에서도 공유가 가능합니다.

PIN은 서버 환경변수 `APP_PIN`으로만 설정합니다. 프런트엔드나 Git에 포함하지 않습니다. 토큰은 현재 탭의 sessionStorage에 보관하며, 일정 원본은 D1에만 저장합니다. 세션은 최대 30일, 브라우저 탭을 닫으면 다시 비밀번호를 입력합니다. 잠금은 오프라인에서도 현재 기기의 화면·토큰을 지우며, 서버 세션 폐기를 시도합니다.

## 로컬 실행

Node.js 22.13 이상이 필요합니다.

```sh
npm ci
cp .env.example .env
# .env에 APP_PIN 설정
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_giant_franklin_richards.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_burly_stature.sql
npm run dev
```

로컬 마이그레이션은 각 파일을 한 번만 적용합니다. 개발 주소는 http://localhost:5173 입니다. Windows에서 npm shim이 잘못된 경로를 사용하면 `node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js"`를 `npm` 대신 사용할 수 있습니다.

## 검증

```sh
npm run typecheck
npm test
# APP_PIN 환경변수 설정 후
npm run test:api
# 배포 API에 대한 연동 검증
node tests/api-smoke.mjs https://kenzie-our-calendar.ohhs2.chatgpt.site
```

API 검증은 `[자동 검증]` 이름의 2099년 일정 한 개를 만들고 지웁니다. 다른 일정을 수정하지 않습니다. 세션 분리, 인증, CORS, 유효성 검사, 중복 생성 방지, 동시 수정, 삭제와 로그아웃을 검증합니다.

## 배포

- Sites는 `.openai/hosting.json`의 기존 프로젝트를 재사용합니다. `APP_PIN`을 secret 환경변수로 설정하고 `npm run build` 결과를 배포합니다. D1 마이그레이션은 배포 시 적용됩니다.
- `npm run build:pages` 후 `static-dist/` 내용을 `kenziedev/kenziedev.github.io` 최신 `master`의 `cal/`에 복사합니다. 기존 블로그·`srpg/`·DNS를 유지합니다.
- 블로그 `_config.yml`의 `pwa.cache.deny_paths`에 `/cal`을 유지해 일정 페이지가 블로그 오프라인 캐시에 저장되지 않도록 합니다.
- API 도메인이 바뀌면 `app/calendar.tsx`의 `API_ORIGIN`과 `lib/server.ts`의 허용 origin을 함께 수정합니다.
- 인증된 API 응답은 `Cache-Control: no-store`입니다. 공개 검색 색인은 비활성화했습니다.

반복 일정의 특정 회차만 수정하는 기능, 푸시 알림, Apple 캘린더 계정 연동은 이 버전에 포함하지 않습니다. 홈 화면에 추가해 모바일 웹앱처럼 사용할 수 있습니다.

진행 상태는 [PLAN.md](PLAN.md)에 기록합니다.
