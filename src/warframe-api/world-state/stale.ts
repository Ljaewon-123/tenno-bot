import type { Dayjs } from '@/utils/dayjs';

/**
 * 만료된 캐시로 내준 값이 실제로 언제 받아진 것인지. **응답 객체 자체를 키로 쓴다** —
 * `get()`이 `{data, asOf}`를 돌려주게 바꾸면 호출부 18곳과 스펙 mock 20여 개가 따라 움직이는데
 * 얻는 건 footer 한 줄이다. 정상 응답은 넣지 않는다(TTL 안이라 `cached 60s`가 맞다).
 *
 * 서비스 필드가 아니라 모듈 상태인 이유: 카드 쪽이 `WorldStateService`를 거치지 않고 물어봐야
 * 스펙의 부분 mock이 이 기능 하나 때문에 전부 바뀌지 않는다. 둘 다 싱글턴이라 인스턴스별로 나눌 것도 없다.
 */
const staleSince = new WeakMap<object, Dayjs>();

export const markStale = (data: unknown, at: Dayjs) => {
  if (typeof data === 'object' && data) staleSince.set(data, at);
};

/** 스테일로 내준 값이면 받아진 시각, 아니면 undefined */
export const staleAsOf = (data: unknown) =>
  typeof data === 'object' && data ? staleSince.get(data) : undefined;
