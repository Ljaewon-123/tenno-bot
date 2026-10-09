import { html, raw, type RawHtml } from '../lib/html.ts';
import { Avatar } from '../components/Avatar.ts';
import { LinkButton } from '../components/Button.ts';
import { Chip, TONE_CLASSES } from '../components/Chip.ts';
import { CommandRef } from '../components/CommandRef.ts';
import { FeatureIcon } from '../components/FeatureIcon.ts';
import { SiteFooter } from '../components/SiteFooter.ts';
import { SiteNav } from '../components/SiteNav.ts';
import { StepCard } from '../components/StepCard.ts';
import { FEATURES, NAV_LINKS, STEPS } from '../data/landing.ts';
import { DOCS_HREF, FOOTER_LINKS, HIDE, INVITE_HREF, KOFI_URL } from '../data/links.ts';

// 목업 그대로 옮긴 고정 SVG(장식용 아이콘) — 사용자 입력이 섞이지 않아 raw()로 통째로 신뢰한다.
const PLUS_ICON = raw(
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 2v12M2 8h12"></path></svg>',
);
const HASH_ICON = raw(
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 6h10M3 10h10M6.5 2.5 5 13.5M11 2.5 9.5 13.5"></path></svg>',
);
const CHECK_ICON = raw(
  '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7.5 2.5 2.5L11 4.5"></path></svg>',
);
const CUP_ICON = raw(
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"></path><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"></path></svg>',
);

function HeroChat(): RawHtml {
  return html`<div class="flex w-full shrink-0 flex-col gap-6 rounded-[28px] border border-border bg-surface p-7 lg:w-[520px]">
    <div class="flex items-center gap-2 text-sm font-bold text-text-faint">${HASH_ICON} clan-alerts</div>
    <div class="flex gap-3.5">
      <div class="h-11 w-11 shrink-0 rounded-full bg-ops-bg"></div>
      <div class="flex flex-col gap-1.5">
        <div class="text-base font-bold text-text">You</div>
        <div class="rounded-2xl rounded-tl-sm bg-surface-2 px-3.5 py-2.5 font-mono text-sm leading-relaxed text-text">
          /alarm register name:axi-ping target:void-fissures interval-minutes:30 tier:Axi
        </div>
      </div>
    </div>
    <div class="flex gap-3.5">
      ${Avatar({ size: 42 })}
      <div class="flex flex-1 flex-col gap-1.5">
        <div class="flex items-center gap-2">
          <span class="text-base font-bold text-text">Teno</span>
          <span class="rounded bg-accent px-1.5 py-0.5 text-[10px] font-extrabold text-on-accent">APP</span>
        </div>
        <div class="flex gap-3 rounded-2xl bg-surface-2 p-4">
          <span class="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-intel-bg text-intel">${CHECK_ICON}</span>
          <div class="flex flex-col gap-1.5">
            <div class="text-base font-bold text-text">
              Alarm registered &middot; <span class="rounded bg-surface px-1.5 font-mono text-sm">01K7B3QX9MZ4T2V8N6R5C1JHDW</span>
            </div>
            <div class="text-sm leading-relaxed text-text-muted">/void-fissures tier:Axi every 30 min &middot; first run in 30 minutes</div>
            <div class="text-xs text-text-faint">/alarm delete id:01K7B3QX9MZ4T2V8N6R5C1JHDW to remove</div>
          </div>
        </div>
      </div>
    </div>
    <div class="self-end text-xs font-semibold text-text-faint">Example conversation</div>
  </div>`;
}

function FeatureCard(feature: (typeof FEATURES)[number]): RawHtml {
  return html`<div class="flex flex-col gap-3.5 rounded-3xl border border-border bg-surface p-7">
    <div class="flex items-center justify-between">
      <span class="flex h-13 w-13 items-center justify-center rounded-2xl ${TONE_CLASSES[feature.tone]}">${FeatureIcon({ iconKey: feature.iconKey })}</span>
      ${Chip({ label: feature.chipLabel, tone: feature.tone })}
    </div>
    <h3 class="font-display text-xl font-bold text-text">${feature.title}</h3>
    <p class="text-base leading-relaxed text-text-muted">${feature.desc}</p>
    ${feature.rarityChips
      ? html`<div class="flex gap-1.5">${feature.rarityChips.map((c) => Chip({ label: c.label, tone: c.tone, class: 'text-[11px]' }))}</div>`
      : ''}
    <div class="mt-auto font-mono text-xs text-text-faint">${feature.commands}</div>
  </div>`;
}

export function render(): RawHtml {
  return html`<div
    id="top"
    class="flex min-h-screen flex-col bg-bg"
    style="background-image: radial-gradient(var(--border) 1.2px, transparent 1.2px); background-size: 28px 28px;"
  >
    ${SiteNav({ links: NAV_LINKS, inviteHref: INVITE_HREF })}

    <main>
    <section class="flex flex-col items-center gap-12 px-6 py-16 sm:px-10 lg:flex-row lg:items-center lg:gap-16 lg:px-24 lg:py-20">
      <div class="flex max-w-xl flex-col gap-6">
        <div class="flex items-end gap-4">
          ${Avatar({ size: 112 })}
          <div class="mb-4 rounded-2xl rounded-bl-none bg-surface-2 px-4.5 py-3 font-display text-lg font-semibold text-text">
            Hi, Tenno! Need a hand?
          </div>
        </div>
        <h1 class="font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-text sm:text-6xl">
          Meet Teno,<br />your pocket <span class="text-accent">Cephalon</span>.
        </h1>
        <p class="text-xl leading-relaxed text-text-muted">
          Ask about Sorties, fissures and drop tables right in chat. Teno keeps an eye on the worldstate, pings your clan on schedule and
          helps you fill a squad.
        </p>
        <div class="mt-1.5 flex flex-wrap gap-3">
          ${INVITE_HREF
            ? LinkButton({ href: INVITE_HREF, label: 'Add to Discord', variant: 'primary', icon: PLUS_ICON, class: 'min-h-14 px-7 text-base' })
            : html`<span class="flex min-h-14 items-center rounded-full bg-accent-soft px-7 text-base font-bold text-accent-text">In beta &middot; invites open soon</span>`}
          ${LinkButton({ href: DOCS_HREF, label: 'Read the docs', variant: 'secondary', class: 'min-h-14 px-7 text-base' })}
        </div>
      </div>
      ${HeroChat()}
    </section>

    <section class="mx-6 grid grid-cols-1 gap-2.5 rounded-[28px] border border-border bg-surface p-2.5 sm:mx-10 sm:grid-cols-3 lg:mx-24" data-stats hidden>
      <div class="flex items-center justify-center gap-3 rounded-full bg-surface-2 px-4 py-4">
        <span class="font-display text-2xl font-extrabold text-text" data-stat="servers">&mdash;</span>
        <span class="text-base font-bold text-text-muted">servers</span>
      </div>
      <div class="flex items-center justify-center gap-3 rounded-full bg-surface-2 px-4 py-4">
        <span class="font-display text-2xl font-extrabold text-text" data-stat="users">&mdash;</span>
        <span class="text-base font-bold text-text-muted">Tenno helped</span>
      </div>
      <div class="flex items-center justify-center gap-3 rounded-full bg-accent-soft px-4 py-4">
        <span class="h-3 w-3 rounded-full bg-accent" aria-hidden="true"></span>
        <span class="font-display text-lg font-bold text-accent-text" data-stat="online">Online now</span>
      </div>
    </section>

    <section id="how-it-works" class="flex flex-col gap-10 px-6 pt-24 sm:px-10 lg:px-24">
      <h2 class="text-center font-display text-3xl font-extrabold text-text sm:text-4xl">Up and running in a minute</h2>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">${STEPS.map(StepCard)}</div>
    </section>

    <section id="features" class="flex flex-col gap-10 px-6 pt-24 sm:px-10 lg:px-24 ${HIDE.kofi ? 'pb-24' : ''}">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 class="font-display text-3xl font-extrabold text-text sm:text-4xl">What Teno can do</h2>
        <a href="${DOCS_HREF}" class="font-bold text-accent-text">See every command &rarr;</a>
      </div>
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        ${FEATURES.map(FeatureCard)}
        <a
          href="${DOCS_HREF}"
          class="flex flex-col justify-center gap-3 rounded-3xl border-2 border-dashed border-border p-7 text-text-muted"
        >
          <span class="font-display text-xl font-bold text-text">And there's more</span>
          <span class="text-base leading-relaxed">Browse the docs, or type ${CommandRef({ children: '/help', tone: 'accent' })} in any server.</span>
        </a>
      </div>
    </section>

    ${HIDE.kofi
      ? ''
      : html`<section
      id="support"
      class="mx-6 my-24 flex flex-col items-center gap-10 rounded-[32px] border border-border bg-surface-2 p-10 text-center sm:mx-10 lg:mx-24 lg:flex-row lg:text-left"
    >
      ${Avatar({ size: 140 })}
      <div class="flex flex-1 flex-col gap-3">
        <h2 class="font-display text-3xl font-extrabold text-text">Buy Teno a coffee?</h2>
        <p class="mx-auto max-w-xl text-lg leading-relaxed text-text-muted lg:mx-0">
          Teno is free and made by one Tenno. Hosting and the database come out of pocket, so any support keeps Teno online.
        </p>
      </div>
      <div class="flex w-full max-w-xs shrink-0 flex-col gap-3">
        ${LinkButton({ href: KOFI_URL, label: 'Support on Ko-fi', variant: 'support', icon: CUP_ICON, class: 'min-h-13.5' })}
      </div>
    </section>`}
    </main>

    ${SiteFooter({ links: FOOTER_LINKS })}
  </div>`;
}
