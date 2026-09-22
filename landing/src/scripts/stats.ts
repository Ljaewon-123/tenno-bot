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

/** API 응답 → 화면 표시 문자열 매핑. 순수 함수라 DOM 없이 테스트한다. */
export function mapStats(res: StatsResponse): StatsDisplay {
  return {
    servers: formatter.format(res.guilds),
    users: formatter.format(res.users),
    online: res.ready,
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
    .then((res) => res.json() as Promise<StatsResponse>)
    .then((data) => applyStats(mapStats(data)))
    .catch(() => {}); // 실패 시 컨테이너는 마크업 기본값(hidden)을 유지 — 에러를 사용자에게 보일 이유가 없음
}
