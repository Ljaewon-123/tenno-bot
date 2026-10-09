import { html, type RawHtml } from '../lib/html.ts';
import { CommandRef } from '../components/CommandRef.ts';
import { CommandSection } from '../components/CommandSection.ts';
import { DocsSidebar } from '../components/DocsSidebar.ts';
import { DocsTopBar } from '../components/DocsTopBar.ts';
import { OnThisPage } from '../components/OnThisPage.ts';
import { SiteFooter } from '../components/SiteFooter.ts';
import { COMMANDS, GETTING_STARTED, SIDEBAR_SECTIONS } from '../data/commands.ts';
import { FOOTER_LINKS, GITHUB_REPO_URL, HOME_HREF, INVITE_HREF } from '../data/links.ts';

// "시작하기" 세 항목 — 실제 슬래시 커맨드가 아니라 짧은 안내문. 근거 없는 내용은 적지 않는다
// (초대 링크·길드 전용 여부·타임존 기본값은 전부 src/utils/timezone.ts, guildOnly() 체크에서 확인됨).
// h2를 쓰는 이유: 페이지 진짜 제목(h1)은 아래 sr-only 하나뿐이고, 이 섹션들은 그 아래 레벨이다.
function GettingStarted(): RawHtml {
  return html`<section id="intro" class="flex flex-col gap-3 border-b border-border pb-10">
      <h2 class="font-display text-3xl font-extrabold text-text">Introduction</h2>
      <p class="max-w-2xl text-lg leading-relaxed text-text-muted">
        Tenno is a Discord bot for Warframe. It answers live worldstate questions right in chat — Sortie, Archon Hunt, Void Fissures,
        open-world cycles, Nightwave, Archimedea, events and Baro Ki'Teer — plus drop and relic lookups, Incarnon Genesis details,
        repeating alarms, worldstate change notifications, and squad recruiting with ${CommandRef({ children: '/party', tone: 'accent' })}.
      </p>
    </section>
    <section id="invite" class="flex flex-col gap-3 border-b border-border py-10">
      <h2 class="font-display text-3xl font-extrabold text-text">Invite &amp; permissions</h2>
      <p class="max-w-2xl text-lg leading-relaxed text-text-muted">
        ${INVITE_HREF
          ? html`<a href="${INVITE_HREF}" class="font-bold text-accent-text">Invite Tenno to your server</a> — every`
          : 'Tenno is in beta and not open for invites yet. Once it is, every'}
        command needs Tenno to already be a member of the server. ${CommandRef({ children: '/notification' })} additionally needs the Manage Server permission, since it
        changes what the whole server gets pinged for.
      </p>
    </section>
    <section id="timezones" class="flex flex-col gap-3 pb-2 pt-10">
      <h2 class="font-display text-3xl font-extrabold text-text">Timezones</h2>
      <p class="max-w-2xl text-lg leading-relaxed text-text-muted">
        ${CommandRef({ children: '/alarm register' })} takes an optional ${CommandRef({ children: 'timezone' })} option. Leave it out
        and Tenno guesses from your Discord locale, falling back to Korea Standard Time if it can't — each alarm keeps its own timezone
        once set.
      </p>
    </section>`;
}

export function render(): RawHtml {
  return html`<div class="flex min-h-screen flex-col bg-bg">
    ${DocsTopBar({ homeHref: HOME_HREF, githubHref: GITHUB_REPO_URL, inviteHref: INVITE_HREF })}
    <h1 class="sr-only">Tenno docs</h1>
    <div class="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row">
      ${DocsSidebar({ gettingStarted: GETTING_STARTED, sections: SIDEBAR_SECTIONS })}
      <main
        class="flex flex-1 flex-col gap-10 px-6 py-8 sm:px-9 lg:my-5 lg:min-w-0 lg:rounded-[28px] lg:border lg:border-border lg:bg-surface lg:px-12 lg:py-11"
      >
        ${GettingStarted()} ${COMMANDS.map(CommandSection)}
      </main>
      ${OnThisPage({ gettingStarted: GETTING_STARTED, commands: COMMANDS })}
    </div>
    ${SiteFooter({ links: FOOTER_LINKS })}
  </div>`;
}
