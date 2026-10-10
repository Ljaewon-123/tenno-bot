import { afterEach, describe, expect, it, vi } from 'vitest';
import { TopggStatsService } from './topgg-stats.service.js';

const client = {
  isReady: () => true,
  user: { id: 'bot-1' },
  guilds: { cache: { size: 42 } },
};
const service = (token?: string) =>
  new TopggStatsService(client as never, { TOPGG_TOKEN: token } as never);

describe('TopggStatsService', () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
  afterEach(() => fetchMock.mockClear());

  it('토큰이 없으면 보내지 않는다', async () => {
    await service().post();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('토큰이 있으면 길드 수를 보고한다', async () => {
    await service('secret').post();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://top.gg/api/bots/bot-1/stats',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'secret' }) as object,
        body: JSON.stringify({ server_count: 42 }),
      }),
    );
  });
});
