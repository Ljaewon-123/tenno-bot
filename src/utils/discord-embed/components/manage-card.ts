import {
  ActionRowBuilder,
  SectionBuilder,
  type ButtonBuilder,
} from 'discord.js';
import { subtext, title as heading } from '../markdown';
import { SECTION_LIMIT } from '../constants';
import { Accent, type Child, type Line, type ManageRow } from '../types';
import { assemble, divider, kept, text } from './card';

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
