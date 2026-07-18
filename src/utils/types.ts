import { Locale } from 'discord.js';

/** IANA 타임존. 표시명 겸 저장값 */
export enum Timezone {
  KST = 'Asia/Seoul',
  JST = 'Asia/Tokyo',
  UTC = 'UTC',
  EST = 'America/New_York',
  PST = 'America/Los_Angeles',
}

// ponytail: locale은 언어지 타임존이 아님 — 근사 휴리스틱, 불만 나오면 유저별 tz 저장으로 승격
export const LOCALE_TIMEZONE: Partial<Record<Locale, Timezone>> = {
  [Locale.Korean]: Timezone.KST,
  [Locale.Japanese]: Timezone.JST,
  [Locale.EnglishUS]: Timezone.EST,
  [Locale.EnglishGB]: Timezone.UTC,
};
