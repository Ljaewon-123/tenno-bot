# teno-landing

Teno 봇의 랜딩 · 문서 · Privacy · Terms 정적 사이트. 봇과 분리된 npm 패키지다 (루트 `tsconfig.json`이 `landing`을 exclude, Railway `watchPatterns`에도 없음 → 여기만 바뀌면 봇은 재배포되지 않는다).

```
npm run dev       # vite dev 서버
npm run build     # tsc --noEmit && vite build → dist/
npm test          # vitest
```

## 진행 상황 (2026-09-22)

브랜치 `feat/landing`, main 미병합. 봇 테스트 202 / 랜딩 테스트 40 통과, 빌드 경고 없음. **브라우저 육안 확인은 아직 안 함.**

| 페이지 | 상태 |
|---|---|
| `index.html` 랜딩 (다크 고정) | 완료 — 시안 Landing2 그대로 |
| `docs.html` 문서 (다크/라이트) | 완료 — 봇 소스에서 커맨드 17개·옵션을 옮김, 검색 필터 |
| `privacy.html` / `terms.html` | 완료 — 저장 데이터는 엔티티 기준으로 검증됨 |

디자인 정본: [시안 캔버스](https://claude.ai/artifact/6Ts8MGKAu2q1fbkWF4VL1h) 2안. 로컬 스냅샷 `docs/design/landing/` (gitignore라 이 PC에만 있음).

## 구조 — 나중에 React/Astro로 옮기기 쉽게

- `src/components/` — `(props) => RawHtml` 순수 함수. DOM 접근·데이터 import 없음. JSX 컴포넌트로 거의 1:1.
- `src/data/` — 의미값만 (`category: 'intel'`, `iconKey`, `tone`). Tailwind 클래스·SVG는 컴포넌트 쪽.
- `src/pages/` — data → components 조립. 빌드 때 `vite.config.ts` 플러그인이 각 HTML의 `<!--app-->`에 끼워 넣는다 (JS 없이도 내용이 보임).
- `src/scripts/` — 브라우저 동작만 (테마 토글, 문서 검색, 스탯 fetch).
- `src/lib/html.ts` — 마크업은 반드시 `html` 태그 템플릿으로 (보간값 자동 이스케이프). `raw()`는 코드 안 상수에만.
- 색은 `src/styles/tokens.css` 토큰 유틸만 (`bg-surface`, `text-loot`). hex 직접 사용 금지.
- import는 항상 `.ts` 확장자 명시 (Vite 8 config 로더 요구).

## TODO

### 배포 전 필수
- [x] `src/data/links.ts` URL 채우기 (2026-10-04)
- [x] 초대 URL 권한 계산 — View Channel + Send Messages + Send Messages in Threads + Embed Links = `274877926400`
- [ ] `npm run dev`로 네 페이지 육안 확인 (데스크톱 + 360px 폰 폭)
- [x] `feat/landing` → main 병합
- [ ] Cloudflare Pages 연결 — Production `landing` 브랜치(CI가 main에서 밀어줌) / Root `landing` / Build `npm run build` / Output `dist` / Watch paths `landing/*`. Node는 `.node-version`(22)을 따른다.

### 봇 쪽 (스탯 알약용)
- [x] `src/app/app.controller.ts`에 `@Get('stats')` — 응답 `{ guilds: number, users: number, ready: boolean }` (`guilds.cache.size`, `memberCount` 합, `isReady()`)
- [x] `main.ts`에 `app.enableCors()` — 공개 GET뿐이라 origin 제한 없이 `*` (2026-09-28)
- [ ] Railway 공개 도메인 발급 → Pages 환경변수 `VITE_STATS_URL`에 넣기. 비어 있거나 실패하면 스탯 영역은 숨겨진다.

### 콘텐츠
- [ ] 아바타 교체 — `src/components/Avatar.ts` 한 파일. 받으면 accent 색도 아바타에 맞춰 조정
- [ ] 파비콘 · OG 메타 (`public/`, 각 HTML `<head>`)
- [ ] 커맨드가 바뀌면 `src/data/commands.ts`도 손으로 갱신 (DTO 자동 생성은 안 함)

### 알고 남겨둔 것 (필요하면)
- 아포스트로피 하나 직선 따옴표 ("And there's more")
- `CommandSection`이 카테고리 표(`CATEGORY_LABEL`/`CATEGORY_TONE`)를 data에서 직접 import — 이전 시 props로
- `/help` `/status` `/shockwave`는 시안에 없어서 Intel에 넣음
- TypeScript 7 / Vite 8 최신 메이저 사용 중
- Privacy/Terms 도메인 확정 후 Discord 개발자 포털에 URL 등록 (75서버 넘으면 인증 신청에 필요)
