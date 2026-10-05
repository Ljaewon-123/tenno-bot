import { html, type RawHtml } from '../lib/html.ts';
import { LegalPage, type LegalSection } from '../components/LegalPage.ts';
import { CONTACT, FOOTER_LINKS, GITHUB_REPO_URL, HOME_HREF, INVITE_HREF } from '../data/links.ts';

const LAST_UPDATED = 'September 22, 2026';

const SECTIONS: LegalSection[] = [
  {
    title: 'The service',
    body: html`<p>
      Teno is provided free, as-is, with no warranty of any kind. Features may change or the service may stop at any time, without
      notice.
    </p>`,
  },
  {
    title: 'Acceptable use',
    body: html`<p>Don't abuse, spam or try to exploit the bot or its commands.</p>`,
  },
  {
    title: 'Not affiliated',
    body: html`<p>
      Teno is a fan-made project and is not affiliated with or endorsed by Digital Extremes. Warframe and related trademarks belong
      to their respective owners.
    </p>`,
  },
  {
    title: 'Contact',
    body: html`<p>Questions about these terms? Reach out via <a href="${CONTACT.href}" class="font-bold text-accent-text">${CONTACT.label}</a>.</p>`,
  },
];

export function render(): RawHtml {
  return LegalPage({
    title: 'Terms of Service',
    updated: LAST_UPDATED,
    sections: SECTIONS,
    footerLinks: FOOTER_LINKS,
    homeHref: HOME_HREF,
    githubHref: GITHUB_REPO_URL,
    inviteHref: INVITE_HREF,
  });
}
