import dayjs from '@/utils/dayjs';
import type { ConfigType } from 'dayjs';

/** 넘치면 자른다. 디스코드는 초과분을 잘라주지 않고 요청 전체를 거절한다 */
export const truncate = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1)}…`;

/** 컨테이너 제목. V2 헤딩(20px/700)은 h1이 아니라 h2다 */
export const title = (text: string) => `## ${text}`;

/** 그룹 헤더·강조. `Steel Path` 같은 배지도 이모지가 아니라 굵게 */
export const bold = (text: string) => `**${text}**`;

/**
 * 회색 보조 줄. 디스코드에 "회색 본문"은 없고 이것뿐이라
 * 부가 정보·안내·데이터 신선도는 전부 여기로 내린다 (footer는 마크다운이 안 먹는다).
 */
export const subtext = (text: string) => `-# ${text}`;

/** "1시간 12분 뒤" — 기본값. 서버가 시각을 문자열로 굽지 않으니 뷰어 시간대 문제가 사라진다 */
export const relative = (date: ConfigType) => `<t:${dayjs(date).unix()}:R>`;

/** "오후 11:40" — 주간 초기화처럼 시점이 고정된 값에만 */
export const at = (date: ConfigType) => `<t:${dayjs(date).unix()}:t>`;

/**
 * "▰▰▰▱▱▱▱▱ 38%" — 8칸 고정 텍스트 배지.
 * 디스코드에 진행바 그래픽은 없다. 칸 수를 데이터에 따라 늘리면 폭이 흔들려 모바일에서 줄이 접힌다.
 */
export const bar = (percent: number) => {
  const filled = Math.min(8, Math.max(0, Math.round(percent / 12.5)));
  return `${'▰'.repeat(filled)}${'▱'.repeat(8 - filled)} ${Math.round(percent)}%`;
};
