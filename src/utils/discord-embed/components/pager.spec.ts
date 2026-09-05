import { describe, expect, it } from 'vitest';
import { paged } from './pager';

const items = Array.from({ length: 20 }, (_, index) => index);
const ids = (
  buttons?: { toJSON(): { custom_id?: string; disabled?: boolean } }[],
) => buttons?.map((b) => [b.toJSON().custom_id, b.toJSON().disabled]);

describe('paged', () => {
  it('한 페이지에 다 들어가면 버튼도 페이지 표기도 없다', () => {
    const view = paged({ key: 'k', items: [1, 2], sort: 'cheapest first' });
    expect(view.buttons).toBeUndefined();
    expect(view.footer).toBe('cheapest first');
  });

  it('잘리면 전체 페이지 수·정렬 기준·양옆 버튼이 함께 붙는다', () => {
    const view = paged({ key: 'k', items, page: 1, sort: 'cheapest first' });
    expect(view.items).toEqual([8, 9, 10, 11, 12, 13, 14, 15]);
    expect(view.footer).toBe('Page 2 / 3 · cheapest first');
    expect(ids(view.buttons)).toEqual([
      ['k/page/0', false],
      ['k/page/2', false],
    ]);
  });

  it('양 끝에서는 넘어갈 방향의 버튼만 죽는다', () => {
    expect(ids(paged({ key: 'k', items, sort: 's' }).buttons)?.[0][1]).toBe(
      true,
    );
    expect(
      ids(paged({ key: 'k', items, page: 2, sort: 's' }).buttons)?.[1][1],
    ).toBe(true);
  });

  it('범위 밖·NaN은 빈 화면 대신 존재하는 페이지로 떨어진다', () => {
    expect(paged({ key: 'k', items, page: 99, sort: 's' }).items).toEqual([
      16, 17, 18, 19,
    ]);
    expect(paged({ key: 'k', items, page: NaN, sort: 's' }).items[0]).toBe(0);
    expect(paged({ key: 'k', items, page: -3, sort: 's' }).items[0]).toBe(0);
  });
});
