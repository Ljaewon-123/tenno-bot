import dayjs from '@/utils/dayjs';
import type { ConfigType } from 'dayjs';

/**
 * 상태를 나타내는 유일한 색 수단. 커맨드별로 색을 나누지 않는다 —
 * 같은 색이 항상 같은 뜻이어야 유저가 색만 보고 판단한다.
 */
export enum Accent {
  /** 기본 · 조회 결과 */
  Default = 0x5865f2,
  /** 임박 · 만료 30분 이내 / 사이클 교체 직전 */
  Soon = 0xfaa61a,
  /** 성공 · 등록·삭제 완료, 파티 정원 마감 */
  Success = 0x57f287,
  /** 에러 · API 실패 / 잘못된 인자 */
  Error = 0xed4245,
  /** 종료·없음 · 빈 상태 / 만료된 이벤트 */
  Muted = 0x4e5058,
}

/** 컨테이너 V2 하드 리밋. 넘기면 초과분이 잘리는 게 아니라 메시지가 통째로 400으로 거절된다 */
export const LIMIT = {
  /** 컨테이너 자식 수 */
  components: 40,
  /** TextDisplay 하나의 글자 수 */
  content: 4000,
} as const;

/**
 * 만료 시각 하나로 accent를 정한다. 이 판정을 커맨드마다 따로 하면
 * "색이 상태를 뜻한다"는 규칙이 제일 먼저 깨진다.
 */
export const accentFor = (expiry: ConfigType, soonMinutes = 30) => {
  const left = dayjs(expiry).diff(dayjs(), 'minute');
  if (left < 0) return Accent.Muted;
  return left <= soonMinutes ? Accent.Soon : Accent.Default;
};
