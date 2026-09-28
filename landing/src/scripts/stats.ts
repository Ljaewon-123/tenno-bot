// 홈페이지 통계 pill(서버 수/유저 수/온라인 여부)을 채우는 스크립트.
// VITE_STATS_URL이 없으면(로컬/프리뷰) 아무 요청도 안 보내고 마크업 기본 상태(hidden)로 둔다.

export interface StatsResponse {
  guilds: number;
  users: number;
  ready: boolean;
}

export interface StatsDisplay {
  servers: string;
  users: string;
  online: boolean;
}

const formatter = new Intl.NumberFormat('en');

/**
 * API 응답 → 화면 표시 문자열 매핑. 순수 함수라 DOM 없이 테스트한다.
 * res는 fetch 응답을 그대로 JSON 파싱한 값이라 타입 선언과 실제 모양이 다를 수 있다 —
 * guilds/users가 숫자가 아니면 null을 반환해 "NaN servers" 같은 표시를 막는다.
 */
export function mapStats(res: unknown): StatsDisplay | null {
  if (typeof res !== 'object' || res === null) return null;
  const { guilds, users, ready } = res as Partial<StatsResponse>;
  if (typeof guilds !== 'number' || typeof users !== 'number') return null;
  return {
    servers: formatter.format(guilds),
    users: formatter.format(users),
    online: ready === true,
  };
}

async function applyStats(display: StatsDisplay): Promise<void> {
  const container = document.querySelector<HTMLElement>('[data-stats]');
  if (!container) return;
  const servers = container.querySelector('[data-stat="servers"]');
  const users = container.querySelector('[data-stat="users"]');
  const online = container.querySelector('[data-stat="online"]');
  if (servers) servers.textContent = display.servers;
  if (users) users.textContent = display.users;
  // ready:false는 실패가 아니라 유효한 응답이므로 pill은 보여주되 문구만 바꾼다.
  if (online) online.textContent = display.online ? 'Online now' : 'Reconnecting…';
  container.hidden = false;
}

const statsUrl: string | undefined = import.meta.env.VITE_STATS_URL;

if (statsUrl) {
  fetch(statsUrl)
    // res.ok 체크 없이 바로 res.json()을 하면 4xx/5xx 에러 바디(JSON이 아니거나 모양이 다름)를
    // 파싱한 값이 그대로 mapStats로 흘러들어가 "NaN servers"처럼 잘못된 화면을 만들 수 있었다.
    .then((res) => (res.ok ? (res.json() as Promise<unknown>) : Promise.reject(res.status)))
    .then((data) => {
      const display = mapStats(data);
      if (display) return applyStats(display);
    })
    .catch(() => {}); // 실패 시 컨테이너는 마크업 기본값(hidden)을 유지 — 에러를 사용자에게 보일 이유가 없음
}
