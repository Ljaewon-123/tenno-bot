import { html, type RawHtml } from '../lib/html.ts';
import { CommandSection } from '../components/CommandSection.ts';
import { DocsSidebar } from '../components/DocsSidebar.ts';
import { DocsTopBar } from '../components/DocsTopBar.ts';
import { OnThisPage } from '../components/OnThisPage.ts';
import { SiteFooter } from '../components/SiteFooter.ts';
import { COMMANDS } from '../data/commands.ts';
import { FOOTER_LINKS } from '../data/landing.ts';
import { INVITE_URL } from '../data/links.ts';

// "시작하기" 세 항목 — 실제 슬래시 커맨드가 아니라 짧은 안내문. 근거 없는 내용은 적지 않는다
// (초대 링크·길드 전용 여부·타임존 기본값은 전부 src/utils/timezone.ts, guildOnly() 체크에서 확인됨).
function GettingStarted(): RawHtml {
  return html`<section id="intro" class="flex flex-col gap-3 border-b border-border pb-10">
      <h1 class="font-display text-3xl font-extrabold text-text">Introduction</h1>
      <p class="max-w-2xl text-lg leading-relaxed text-text-muted">
        Teno is a Discord bot for Warframe. It answers live worldstate questions right in chat — Sortie, Archon Hunt, Void Fissures,
        open-world cycles, Nightwave, Archimedea, events and Baro Ki'Teer — plus drop and relic lookups, Incarnon Genesis details,
        repeating alarms, worldstate change notifications, and squad recruiting with <span class="font-mono text-accent-text">/party</span>.
      </p>
    </section>
    <section id="invite" class="flex flex-col gap-3 border-b border-border py-10">
      <h1 class="font-display text-3xl font-extrabold text-text">Invite &amp; permissions</h1>
      <p class="max-w-2xl text-lg leading-relaxed text-text-muted">
        <a href="${INVITE_URL}" class="font-bold text-accent-text">Invite Teno to your server</a> — every command needs Teno to already
        be a member there. <span class="font-mono text-sm text-text">/notification</span> additionally needs the Manage Server
        permission, since it changes what the whole server gets pinged for.
      </p>
    </section>
    <section id="timezones" class="flex flex-col gap-3 pb-2 pt-10">
      <h1 class="font-display text-3xl font-extrabold text-text">Timezones</h1>
      <p class="max-w-2xl text-lg leading-relaxed text-text-muted">
        <span class="font-mono text-sm text-text">/alarm register</span> takes an optional
        <span class="font-mono text-sm text-text">timezone</span> option. Leave it out and Teno guesses from your Discord locale,
        falling back to Korea Standard Time if it can't — each alarm keeps its own timezone once set.
      </p>
    </section>`;
}

export function render(): RawHtml {
  return html`<div class="flex min-h-screen flex-col bg-bg">
    ${DocsTopBar()}
    <div class="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
      ${DocsSidebar()}
      <main
        class="flex flex-1 flex-col gap-10 px-6 py-8 sm:px-9 lg:my-5 lg:min-w-0 lg:rounded-[28px] lg:border lg:border-border lg:bg-surface lg:px-12 lg:py-11"
      >
        ${GettingStarted()} ${COMMANDS.map(CommandSection)}
      </main>
      ${OnThisPage()}
    </div>
    ${SiteFooter({ links: FOOTER_LINKS })}
  </div>`;
}
