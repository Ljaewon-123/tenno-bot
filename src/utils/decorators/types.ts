import { APIApplicationCommandStringOption } from 'discord.js';

export type EnumOptionParams<T extends Record<string, string>> = Omit<
  APIApplicationCommandStringOption,
  'type' | 'choices'
> & {
  enum: T;
};
