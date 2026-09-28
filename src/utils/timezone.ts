import { Locale } from 'discord.js';
import { Timezone } from './types';

// locale은 언어지 타임존이 아님 — 근사 휴리스틱, 불만 나오면 유저별 tz 저장으로 승격
export const LOCALE_TIMEZONE: Partial<Record<Locale, Timezone>> = {
  [Locale.Korean]: Timezone.KST,
  [Locale.Japanese]: Timezone.JST,
  [Locale.EnglishUS]: Timezone.EST,
  [Locale.EnglishGB]: Timezone.UTC,
};

/** 옵션으로 받은 값 > locale 추정 > KST */
export const resolveTimezone = (locale: Locale, picked?: Timezone): Timezone =>
  picked ?? LOCALE_TIMEZONE[locale] ?? Timezone.KST;
