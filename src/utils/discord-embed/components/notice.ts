import { ActionRowBuilder, type ButtonBuilder } from 'discord.js';
import { subtext, title as heading } from '../markdown';
import { Accent, type Child, type Line } from '../types';
import { assemble, kept, text } from './card';
import { payload } from './message';

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

export const emptyCard = (
  title: string,
  reason: Line,
  hint?: Line,
  buttons?: ButtonBuilder[],
) => notice(Accent.Muted, title, reason, hint, buttons);

export const errorCard = (title: string, reason: Line, hint?: Line) =>
  notice(Accent.Error, title, reason, hint);

export const okCard = (title: string, reason: Line, hint?: Line) =>
  notice(Accent.Success, title, reason, hint);

export const guildOnly = () =>
  payload(
    errorCard(
      'Server only',
      'This command needs a server channel to post into.',
      'Run it in a server, not in DMs',
    ),
  );
