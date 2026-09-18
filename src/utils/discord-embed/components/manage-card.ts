import {
  ActionRowBuilder,
  SectionBuilder,
  type ButtonBuilder,
} from 'discord.js';
import { subtext, title as heading } from '../markdown';
import { Accent } from '../types';
import { assemble, divider, kept, text, type Child, type Line } from './card';

/** 조작 대상이라 식별자가 보여야 한다. 버튼이 붙은 항목에는 id를 쓰지 않는다 — 버튼이 대신한다 */
export type ManageRow = { text: string; button?: ButtonBuilder };

/**
 * 버튼 달린 항목을 한 화면에 몇 개까지 펴는가. **빌더 제약이 아니라 고른 페이지 크기다** —
 * 컨테이너당 Section 개수에는 제한이 없다(`1-3`은 Section *안의* TextDisplay 개수 제한이고,
 * 넷을 넣으면 그때 거부된다). `/incarnon`은 이미 퍽 9개를 Section으로 내고, `/relic`은 보상 8개를 낸다.
 * 늘리려면 40칸 예산만 보면 된다 — Section 하나가 3칸이다.
 */
export const SECTION_LIMIT = 3;

/**
 * 원형 D(관리 목록) — /alarm list · /notification list · /party list.
 * 앞 3개만 버튼 달린 Section이 되고 나머지는 목록으로 떨어진다. 목록 항목은 커맨드로 지울 수 있게 id를 남긴다.
 */
export const manageCard = ({
  accent = Accent.Default,
  title,
  rows,
  buttons,
  footer,
}: {
  accent?: Accent;
  title: string;
  rows: ManageRow[];
  buttons?: ButtonBuilder[];
  footer?: Line;
}) => {
  const sections = rows.filter((row) => row.button).slice(0, SECTION_LIMIT);
  const listed = rows.filter((row) => !sections.includes(row));

  const children: Child[] = [text(heading(title))];

  for (const row of sections) {
    children.push(
      divider(),
      new SectionBuilder()
        .addTextDisplayComponents(text(row.text))
        // sections는 button이 있는 행만 담는다
        .setButtonAccessory(row.button as ButtonBuilder),
    );
  }

  const rest = kept(listed.map((row) => `- ${row.text}`)).join('\n');
  if (rest) children.push(divider(), text(rest));

  if (buttons?.length)
    children.push(
      divider(),
      new ActionRowBuilder<ButtonBuilder>().addComponents(buttons),
    );

  if (footer) children.push(text(subtext(footer)));

  return assemble(accent, children);
};
