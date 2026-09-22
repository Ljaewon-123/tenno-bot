// 사이드바 검색창 필터. 매칭 자체는 순수 함수로 떼어 테스트하고, DOM 조작은 이 파일 하단에서만 한다.

export interface SearchEntry {
  name: string;
  description: string;
}

/** 커맨드 이름 또는 설명에 대소문자 무시 부분일치 — 빈 질의는 전체를 통과시킨다 */
export function matchesQuery(entry: SearchEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return entry.name.toLowerCase().includes(q) || entry.description.toLowerCase().includes(q);
}

// vitest는 기본 node 환경이라 `document`가 없다 — 순수 함수 테스트가 이 파일을 import할 때
// 모듈 최상단에서 DOM을 건드리면 그 자체로 터진다. 브라우저에서만 초기화한다.
if (typeof document !== 'undefined') {
  const input = document.querySelector<HTMLInputElement>('[data-docs-search]');
  const groups = document.querySelectorAll<HTMLElement>('[data-sidebar-group]');

  const applyFilter = (query: string): void => {
    groups.forEach((group) => {
      let visible = 0;
      group.querySelectorAll<HTMLAnchorElement>('[data-cmd-name]').forEach((link) => {
        const match = matchesQuery({ name: link.dataset.cmdName ?? '', description: link.dataset.cmdDesc ?? '' }, query);
        link.hidden = !match;
        if (match) visible += 1;
      });
      group.hidden = visible === 0;
    });
  };

  if (input) {
    input.addEventListener('input', () => applyFilter(input.value));
  }
}
