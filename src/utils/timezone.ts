import { Locale } from 'discord.js';
import { LOCALE_TIMEZONE, Timezone } from './types';

/** 옵션으로 받은 값 > locale 추정 > KST */
export const resolveTimezone = (locale: Locale, picked?: Timezone): Timezone =>
  picked ?? LOCALE_TIMEZONE[locale] ?? Timezone.KST;
