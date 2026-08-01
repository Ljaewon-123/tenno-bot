import dayjs from '@/utils/dayjs';
import { WorldStateService } from './world-state.service';

/** 만료 판정이 틀리면 API를 매번 때리거나 낡은 응답을 계속 돌려준다 */
describe('WorldStateService 캐시', () => {
  const build = (expiresAt: ReturnType<typeof dayjs> | null | undefined) => {
    const request = jest.fn().mockResolvedValue({ id: 'fresh' });
    const save = jest.fn();
    const cacheRepository = {
      findOneBy: jest
        .fn()
        .mockResolvedValue(
          expiresAt === undefined
            ? null
            : { key: 'world-state-sortie', cache: { id: 'cached' }, expiresAt },
        ),
      create: jest.fn((value: object) => ({ ...value })),
      save,
    };
    const service = new WorldStateService(
      { request } as never,
      cacheRepository as never,
    );
    return { service, request, save };
  };

  it('만료 전이면 API를 부르지 않는다', async () => {
    const { service, request } = build(dayjs().add(30, 'second'));

    await expect(service.sortie()).resolves.toEqual({ id: 'cached' });
    expect(request).not.toHaveBeenCalled();
  });

  it('만료됐으면 다시 받아 저장한다', async () => {
    const { service, request, save } = build(dayjs().subtract(1, 'second'));

    await expect(service.sortie()).resolves.toEqual({ id: 'fresh' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ cache: { id: 'fresh' } }),
    );
  });

  it('캐시 행이 없으면 받아서 새로 만든다', async () => {
    const { service, request, save } = build(undefined);

    await expect(service.sortie()).resolves.toEqual({ id: 'fresh' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalled();
  });
});
