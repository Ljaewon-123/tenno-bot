import { html, type RawHtml } from '../lib/html.ts';
import { DocsTopBar } from '../components/DocsTopBar.ts';
import { SiteFooter } from '../components/SiteFooter.ts';
import { FOOTER_LINKS } from '../data/landing.ts';
import { SUPPORT_SERVER_URL } from '../data/links.ts';

const LAST_UPDATED = 'September 22, 2026';

function Section(title: string, body: RawHtml): RawHtml {
  return html`<section class="flex flex-col gap-3">
    <h2 class="font-display text-2xl font-bold text-text">${title}</h2>
    ${body}
  </section>`;
}

// 목록 항목은 실제 TypeORM 엔티티(AlarmConfig/Notification/NotificationHistory/Party, 전부
// CommonWithGuildChannel 상속)와 1:1로 대응한다 — 봇 검증 심사용 문서라 코드에 없는 항목을 적으면 안 된다.
function WhatWeStore(): RawHtml {
  return Section(
    'What we store',
    html`<ul class="list-disc space-y-2 pl-5">
      <li>
        Your server's Discord ID and, where relevant, a channel ID — so an alarm, a worldstate subscription or a party post knows
        where to run and where to post.
      </li>
      <li>
        Your Discord user ID — only for a one-off <span class="font-mono text-sm text-text">/alarm</span> reminder you set for
        yourself (to DM you when it fires) and for a party you host or join with
        <span class="font-mono text-sm text-text">/party</span> (host ID and member list).
      </li>
      <li>
        The alarm settings you give <span class="font-mono text-sm text-text">/alarm register</span>: name, optional description,
        which Warframe info to post, repeat interval and timezone.
      </li>
      <li>
        Which Warframe worldstate event a server subscribed to with <span class="font-mono text-sm text-text">/notification on</span>,
        plus a short-lived log of failed delivery attempts (kept 30 days, not tied to any server or user) used only to catch a
        subscription that keeps breaking.
      </li>
      <li>
        The party posts made with <span class="font-mono text-sm text-text">/party create</span>: name, mission text, size,
        visibility label, member list and the Discord message the recruiting post lives in.
      </li>
    </ul>`,
  );
}

function WhatWeDontStore(): RawHtml {
  return Section(
    "What we don't store",
    html`<p>
      Teno does not read or store the content of your regular messages. As a slash-command bot it only ever receives the values you
      type into a command it runs — an alarm name, a party's mission text — never anything else said in the channel.
    </p>
    <p>
      Teno also looks up public Warframe game data (worldstate, drop tables, Incarnon perks) from third-party sources — Warframe
      status APIs and the Warframe Wiki. Those requests go to a fixed, code-defined list of endpoints and never carry your Discord
      IDs, server name or anything you typed.
    </p>`,
  );
}

function AutomaticDeletion(): RawHtml {
  return Section(
    'Automatic deletion',
    html`<p>
      If Teno is removed from a server, or a channel it was using is deleted, Discord tells Teno right away and it deletes every
      alarm, subscription and party tied to that server or channel immediately — there's no separate cleanup job to wait on.
    </p>`,
  );
}

function Contact(): RawHtml {
  return Section(
    'Contact',
    html`<p>
      Questions, or a deletion request outside the cases above? Reach out on the
      <a href="${SUPPORT_SERVER_URL}" class="font-bold text-accent-text">support server</a>.
    </p>`,
  );
}

export function render(): RawHtml {
  return html`<div class="flex min-h-screen flex-col bg-bg">
    ${DocsTopBar({ showSearch: false })}
    <main class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-14 sm:px-9 lg:py-20">
      <div class="flex flex-col gap-3">
        <h1 class="font-display text-4xl font-extrabold text-text sm:text-5xl">Privacy Policy</h1>
        <p class="text-sm font-semibold text-text-faint">Last updated ${LAST_UPDATED}</p>
      </div>
      <div class="flex flex-col gap-9 text-lg leading-relaxed text-text-muted">
        ${WhatWeStore()} ${WhatWeDontStore()} ${AutomaticDeletion()} ${Contact()}
      </div>
    </main>
    ${SiteFooter({ links: FOOTER_LINKS })}
  </div>`;
}
