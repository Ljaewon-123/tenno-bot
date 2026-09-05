import { ActionRowBuilder, type ButtonBuilder } from 'discord.js';
import { subtext, title as heading } from '../markdown';
import { Accent } from '../types';
import { assemble, kept, text, type Child, type Line } from './card';

/**
 * 제목 1줄 + 이유 1줄 + -# 대안 1줄. 구분선도 썸네일도 없다 —
 * 어느 커맨드에서 나오든 같은 모양이라 즉시 구분되고, 짧다는 것 자체가 "끝났다"는 신호다.
 */
const notice = (
  accent: Accent,
  title: string,
  reason: Line,
  hint?: Line,
  buttons?: ButtonBuilder[],
) => {
  const children: Child[] = [
    text(kept([heading(title), reason, hint && subtext(hint)]).join('\n')),
  ];
  if (buttons?.length)
    children.push(new ActionRowBuilder<ButtonBuilder>().addComponents(buttons));
  return assemble(accent, children);
};

/**
 * 항목 0개. 사과문이 아니라 안내로 쓴다 — /events처럼 이게 기본 화면인 커맨드도 있다.
 * 버튼은 막다른 길을 만들지 않기 위한 진입 하나만.
 */
export const emptyCard = (
  title: string,
  reason: Line,
  hint?: Line,
  buttons?: ButtonBuilder[],
) => notice(Accent.Muted, title, reason, hint, buttons);

/** 버튼을 두지 않는다 — 재시도는 커맨드를 다시 치는 쪽이 싸다 */
export const errorCard = (title: string, reason: Line, hint?: Line) =>
  notice(Accent.Error, title, reason, hint);

/** 등록·삭제 확인 */
export const okCard = (title: string, reason: Line, hint?: Line) =>
  notice(Accent.Success, title, reason, hint);
