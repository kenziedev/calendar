# 우리의 달력

현쪼기·쩡개굴의 공유 캘린더. 기본 접근 주소는 **https://kenzie.kr/cal/** 입니다.

## 기능

- 월 달력·일정 목록, 오늘 이동, 날짜 선택, 제목·장소·메모 검색
- 현쪼기(파랑), 쩡개굴(초록), 함께(분홍) 캘린더와 표시 필터
- 일정 생성·수정·삭제, 종일·시간·기간 일정, 장소·메모
- 매일·매주·매월·매년 반복과 종료일 (반복 수정·삭제는 전체 시리즈)
- 비밀번호 인증, 기기별 세션, 잠금, 로그인 시도 제한
- 서버 공유 저장, 15초마다/화면 복귀 시 새로고침, 동시 수정 충돌 방지
- PC·모바일 대응, 서울 시간 기준, 키보드·스크린리더 지원

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
