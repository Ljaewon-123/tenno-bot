import type { Dayjs } from '@/utils/dayjs.js';

/** 스테일 캐시로 내준 응답의 실제 수신 시각. 응답 객체를 키로 써서 get()의 반환 타입을 안 바꾼다 */
const staleSince = new WeakMap<object, Dayjs>();

export const markStale = (data: unknown, at: Dayjs) => {
  if (typeof data === 'object' && data) staleSince.set(data, at);
};

export const staleAsOf = (data: unknown) =>
  typeof data === 'object' && data ? staleSince.get(data) : undefined;
