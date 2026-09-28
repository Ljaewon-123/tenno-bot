import { html, type RawHtml } from '../lib/html.ts';
import { CommandRef } from '../components/CommandRef.ts';
import { LegalPage, type LegalSection } from '../components/LegalPage.ts';
import { FOOTER_LINKS, GITHUB_REPO_URL, HOME_HREF, INVITE_URL, SUPPORT_SERVER_URL } from '../data/links.ts';

const LAST_UPDATED = 'September 22, 2026';

// 목록 항목은 실제 TypeORM 엔티티(AlarmConfig/Notification/NotificationHistory/Party, 전부
// CommonWithGuildChannel 상속)와 1:1로 대응한다 — 봇 검증 심사용 문서라 코드에 없는 항목을 적으면 안 된다.
const WHAT_WE_STORE: LegalSection = {
  title: 'What we store',
  body: html`<ul class="list-disc space-y-2 pl-5">
    <li>
      Your server's Discord ID and, where relevant, a channel ID — so an alarm, a worldstate subscription or a party post knows where
      to run and where to post.
    </li>
    <li>
      Your Discord user ID — only for a one-off reminder you set with an info embed's 🔔 button (to DM you when it fires) and for a
      party you host or join with ${CommandRef({ children: '/party' })} (host ID and member list).
    </li>
    <li>
      The alarm settings you give ${CommandRef({ children: '/alarm register' })}: name, optional description, which Warframe info to
      post, repeat interval and timezone.
    </li>
    <li>
      Which Warframe worldstate event a server subscribed to with ${CommandRef({ children: '/notification on' })}, plus a short-lived
      log of failed delivery attempts (kept 30 days, not tied to any server or user) used only to catch a subscription that keeps
      breaking.
    </li>
    <li>
      The party posts made with ${CommandRef({ children: '/party create' })}: name, mission text, size, visibility label, member list
      and the Discord message the recruiting post lives in.
    </li>
  </ul>`,
};

const WHAT_WE_DONT_STORE: LegalSection = {
  title: "What we don't store",
  body: html`<p>
      Teno does not read or store the content of your regular messages. As a slash-command bot it only ever receives the values you
      type into a command it runs — an alarm name, a party's mission text — never anything else said in the channel.
    </p>
    <p>
      Teno also looks up public Warframe game data (worldstate, drop tables, Incarnon perks) from third-party sources — Warframe
      status APIs and the Warframe Wiki. Those requests go to a fixed, code-defined list of endpoints and never carry your Discord
      IDs, server name or anything you typed.
    </p>`,
};

const AUTOMATIC_DELETION: LegalSection = {
  title: 'Automatic deletion',
  body: html`<p>
    If Teno is removed from a server, or a channel it was using is deleted, Discord tells Teno right away and it deletes every alarm,
    subscription and party tied to that server or channel immediately — there's no separate cleanup job to wait on.
  </p>`,
};

function contact(): LegalSection {
  return {
    title: 'Contact',
    body: html`<p>
      Questions, or a deletion request outside the cases above? Reach out on the
      <a href="${SUPPORT_SERVER_URL}" class="font-bold text-accent-text">support server</a>.
    </p>`,
  };
}

export function render(): RawHtml {
  return LegalPage({
    title: 'Privacy Policy',
    updated: LAST_UPDATED,
    sections: [WHAT_WE_STORE, WHAT_WE_DONT_STORE, AUTOMATIC_DELETION, contact()],
    footerLinks: FOOTER_LINKS,
    homeHref: HOME_HREF,
    githubHref: GITHUB_REPO_URL,
    inviteHref: INVITE_URL,
  });
}
