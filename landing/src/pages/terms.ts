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

export function render(): RawHtml {
  return html`<div class="flex min-h-screen flex-col bg-bg">
    ${DocsTopBar({ showSearch: false })}
    <main class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-14 sm:px-9 lg:py-20">
      <div class="flex flex-col gap-3">
        <h1 class="font-display text-4xl font-extrabold text-text sm:text-5xl">Terms of Service</h1>
        <p class="text-sm font-semibold text-text-faint">Last updated ${LAST_UPDATED}</p>
      </div>
      <div class="flex flex-col gap-9 text-lg leading-relaxed text-text-muted">
        ${Section('The service', html`<p>Teno is provided free, as-is, with no warranty of any kind. Features may change or the service may stop at any time, without notice.</p>`)}
        ${Section('Acceptable use', html`<p>Don't abuse, spam or try to exploit the bot or its commands.</p>`)}
        ${Section(
          'Not affiliated',
          html`<p>
            Teno is a fan-made project and is not affiliated with or endorsed by Digital Extremes. Warframe and related trademarks
            belong to their respective owners.
          </p>`,
        )}
        ${Section(
          'Contact',
          html`<p>Questions about these terms? Reach out on the <a href="${SUPPORT_SERVER_URL}" class="font-bold text-accent-text">support server</a>.</p>`,
        )}
      </div>
    </main>
    ${SiteFooter({ links: FOOTER_LINKS })}
  </div>`;
}
