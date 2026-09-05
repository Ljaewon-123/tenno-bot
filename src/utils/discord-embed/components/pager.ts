import { ButtonStyle } from 'discord.js';
import { button } from './message';

/** 한 페이지에 펴는 줄 수. 8줄이 넘으면 카드가 채널 한 화면을 넘긴다 */
const PAGE_SIZE = 8;

export type PagerInput<T> = {
  /** customId 앞자리. 핸들러의 `@Button('<key>/page/:page')`와 같아야 한다 */
  key: string;
  items: T[];
  /** 버튼에서 온 값. 문자열·NaN·범위 밖 전부 0페이지로 떨어진다 */
  page?: number;
  /** "cheapest first" — 정렬 기준을 밝혀야 잘린 8개가 임의 표본이 아니라 상위 8개가 된다 */
  sort: string;
  size?: number;
};

/**
 * 잘림에는 항상 (전체 개수 · 정렬 기준 · 나머지를 볼 경로) 셋이 붙는다.
 * "…and 33 more"처럼 개수만 던지면 목록이 아니라 미끼다 — 유저는 결국 위키로 나간다.
 *
 * 새 메시지를 쌓지 않고 같은 메시지를 갈아끼우는 전제다(캐러셀은 채널을 오염시킨다).
 * 버튼은 컴포넌트 인터랙션이라 슬래시 커맨드의 15분 토큰 만료와 무관하게 계속 눌린다.
 */
export const paged = <T>({
  key,
  items,
  page = 0,
  sort,
  size = PAGE_SIZE,
}: PagerInput<T>) => {
  const pages = Math.max(1, Math.ceil(items.length / size));
  // 데이터가 갱신돼 페이지가 사라졌을 수 있다 — 빈 화면 대신 마지막 페이지를 준다
  const current = Math.min(Math.max(page || 0, 0), pages - 1);
  const start = current * size;

  return {
    items: items.slice(start, start + size),
    // 넘길 게 없는데 버튼을 남기면 눌러보게 된다
    buttons:
      pages > 1
        ? [
            button(
              `${key}/page/${current - 1}`,
              '◀',
              ButtonStyle.Secondary,
              current === 0,
            ),
            button(
              `${key}/page/${current + 1}`,
              '▶',
              ButtonStyle.Secondary,
              current === pages - 1,
            ),
          ]
        : undefined,
    footer: pages > 1 ? `Page ${current + 1} / ${pages} · ${sort}` : sort,
  };
};
