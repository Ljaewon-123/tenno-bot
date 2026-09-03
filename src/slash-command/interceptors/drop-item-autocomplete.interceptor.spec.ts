import { describe, expect, it, vi } from 'vitest';
import { DropItemAutocompleteInterceptor } from './drop-item-autocomplete.interceptor';

/** 조회가 터져도 자동완성은 응답해야 한다 — 안 그러면 디스코드에 "로딩 실패"가 뜬 채 남는다 */
describe('DropItemAutocompleteInterceptor', () => {
  const build = (searchItemNames: () => Promise<string[]>) => {
    const respond = vi.fn();
    const interceptor = new DropItemAutocompleteInterceptor({
      searchItemNames,
    } as never);
    const interaction = {
      options: { getFocused: () => ({ name: 'item', value: 'ash' }) },
      respond,
    } as never;
    return { interceptor, interaction, respond };
  };

  it('검색 결과를 선택지로 넘긴다', async () => {
    const { interceptor, interaction, respond } = build(() =>
      Promise.resolve(['Ash Prime Blueprint']),
    );
    await interceptor.transformOptions(interaction);

    expect(respond).toHaveBeenCalledWith([
      { name: 'Ash Prime Blueprint', value: 'Ash Prime Blueprint' },
    ]);
  });

  it('조회가 실패하면 빈 목록으로 응답한다', async () => {
    const { interceptor, interaction, respond } = build(() =>
      Promise.reject(new Error('db down')),
    );
    await interceptor.transformOptions(interaction);

    expect(respond).toHaveBeenCalledWith([]);
  });
});
