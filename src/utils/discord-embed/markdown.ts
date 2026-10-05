import dayjs from '@/utils/dayjs';
import type { ConfigType } from 'dayjs';
import { escapeMarkdown } from 'discord.js';

/** 넘치면 자른다. 디스코드는 초과분을 잘라주지 않고 요청 전체를 거절한다 */
export const truncate = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1)}…`;

/** 유저·외부 입력은 이걸 거친다 — 봇 명의 메시지에 마스킹 링크가 살아 있으면 피싱 통로가 된다. 기본 옵션은 링크·헤딩을 안 막는다 */
export const literal = (text: string) =>
  escapeMarkdown(text, { maskedLink: true, heading: true });

export const title = (text: string) => `## ${text}`;

export const bold = (text: string) => `**${text}**`;

/** 회색 보조 줄 — footer는 마크다운이 안 먹어 부가 정보는 전부 여기로 */
export const subtext = (text: string) =>
  // `-#`는 줄 단위다 — 여러 줄을 한 번만 감싸면 둘째 줄부터 본문 크기로 튀어 위계가 깨진다
  text
    .split('\n')
    .map((line) => `-# ${line}`)
    .join('\n');

/** 뷰어 시간대로 렌더된다 — 서버가 시각을 문자열로 굽지 않는다 */
export const relative = (date: ConfigType) => `<t:${dayjs(date).unix()}:R>`;

/** 8칸 고정 — 칸 수가 바뀌면 폭이 흔들려 모바일에서 줄이 접힌다 */
export const bar = (percent: number) => {
  const filled = Math.min(8, Math.max(0, Math.round(percent / 12.5)));
  return `${'▰'.repeat(filled)}${'▱'.repeat(8 - filled)}`;
};
