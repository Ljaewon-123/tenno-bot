# teno-bot

Warframe 정보를 제공하는 Discord 봇. NestJS + necord(discord.js) + TypeORM(Postgres).

## 명령어

```
npm run dev     # watch 모드 실행
npm test        # vitest run
npm run lint    # eslint --fix
```

배포는 `main` push → GitHub Actions가 테스트 후 `deploy` 브랜치로 force push

## 구조

```
src/
  app/            부트스트랩, 전역 필터/인터셉터, 봇 라이프사이클 훅
  config/         환경변수(AppConfig) + DB 설정
  slash-command/  Discord 인터랙션 진입점 (얇게 유지)
  alarm/          주기 알람 (@Interval 60s)
  notification/   월드스테이트 변화 감지 → 구독 채널 발송 (@Cron 10m)
  party/          파티 모집 (버튼 인터랙션 + 만료 크론)
  warframe-api/   외부 API — 도메인 모듈이 의존하는 독립 모듈
  utils/          외부 lib - 독립적인 utils
```

**의존 방향은 한 방향이다.** `slash-command → 도메인(alarm/notification/party) → warframe-api → utils`.
도메인끼리는 서로 import 하지 않는다. warframe-api는 Discord를 모른다(임베드 생성만 예외).

## 레이어 규칙

- **커맨드 서비스는 얇게.** 인터랙션에서 값 꺼내고, 도메인 서비스 호출하고, 응답만. 비즈니스 로직·DB 접근 금지.
- **도메인 서비스가 로직과 트랜잭션을 가진다.** 에러는 `throw new BadRequestException('...')` 한 줄 — 전역 필터가 유저에게 그대로 보여준다.
- **Repository는 `Mixin(Entity)` 상속 한 줄.** (`src/utils/entity/mixin.ts`) 매우 복잡한 쿼리가 아니면 별도 인터페이스 만들지 않는다.
- 모듈은 `providers`에 Repository를 등록하고 `TypeOrmModule.forFeature([Entity])`를 imports 한다.

## Discord 규칙

- **핸들러는 `reply()`가 아니라 `editReply()`를 쓴다.** `CommandLoggingInterceptor`가 슬래시 커맨드를 미리 defer 한다(초기 응답 3초 제한 회피). 버튼(`@Button`)은 defer 대상이 아니라 `update()`를 쓴다.
- 커맨드 그룹은 `createCommandGroupDecorator`로 분리 (`slash-command/decorators/`).
- 커맨드 옵션 DTO는 `@Expose() + @StringOption/@IntegerOption`. enum 옵션은 `EnumOption` 데코레이터.
- 임베드 필드는 25개, 필드 name 256자·value 1024자 제한 — 항상 slice 한다.
- 길드/채널이 사라지면 데이터를 지운다. `BotLifecycleHook`이 `guildDelete`/`channelDelete`에서 각 도메인 `cleanup(where)`를 호출한다. **새 도메인 엔티티를 만들면 `cleanup`을 구현하고 훅에 등록한다.**

## 스타일

- 경로 별칭 `@/*` → `src/*`. 상대경로는 같은 모듈 내부에서만.
- 주석은 한국어. **"무엇"이 아니라 "왜"를 적는다** — 이 코드베이스 주석은 대부분 제약이나 실패 사례를 기록한다. 그 스타일을 유지할 것.
- `await`가 없어도 `async`를 명시한다 (`require-await` off).
- enum/타입은 모듈별 `vo/` 또는 `types.ts`에 둔다.
- 유저에게 나가는 메시지는 영어로 한다.
- 짧은 예외 처리는 try-catch가 아니라 .then.catch같은 체이닝 방식으로 한다.

## 테스트

- vitest, `*.spec.ts`를 소스 옆에. **서비스 로직만 테스트하고 repository/discord client는 수동 mock 객체로 주입한다** — Nest `Test.createTestingModule` 안 쓴다.
- vitest는 swc 플러그인으로 돈다(esbuild는 `emitDecoratorMetadata`를 못 만들어 엔티티 import만으로 터진다). 이 설정 건드리지 말 것.
