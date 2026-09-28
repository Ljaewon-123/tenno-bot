import { ButtonStyle } from 'discord.js';
import { PAGE_SIZE } from '../constants';
import type { PagerInput } from '../types';
import { button } from './message';

/** 새 메시지를 쌓지 않고 같은 메시지를 갈아끼우는 전제다 */
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
