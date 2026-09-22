import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
// 페이지 모듈을 여기서 정적으로 import한다 — Vite가 vite.config 자체를 이 import들과
// 함께 번들링해서, 페이지 소스가 바뀌면 dev 서버가 자동으로 재시작된다(별도 watch 설정 불필요).
import { render as renderDocs } from './src/pages/docs.ts';
import { render as renderLanding } from './src/pages/landing.ts';
import { render as renderPrivacy } from './src/pages/privacy.ts';
import { render as renderTerms } from './src/pages/terms.ts';
import { PLACEHOLDER_URLS, isPlaceholder } from './src/data/links.ts';

const pageByEntry: Record<string, () => { toString(): string }> = {
  index: renderLanding,
  docs: renderDocs,
  privacy: renderPrivacy,
  terms: renderTerms,
};

// 각 HTML 파일의 <!--app-->를 대응하는 페이지 모듈의 render() 결과로 치환 — 클라이언트 JS 없이도
// 콘텐츠가 이미 채워진 정적 HTML을 만들기 위한 최소 프리렌더 파이프라인.
function prerender(): Plugin {
  return {
    name: 'teno-prerender',
    transformIndexHtml(html, ctx) {
      const entry = ctx.filename.split(/[\\/]/).pop()?.replace(/\.html$/, '') ?? '';
      const render = pageByEntry[entry];
      if (!render) return html;
      return html.replace('<!--app-->', render().toString());
    },
  };
}

// CF_PAGES(Cloudflare Pages 배포 빌드)에서 links.ts 값이 여전히 [INVITE URL] 같은 대괄호
// placeholder면 빌드를 실패시킨다 — 안 그러면 href가 /[INVITE URL]로 나가고 Cloudflare Pages가
// 존재하지 않는 경로를 index.html로 폴백해서, 메인 CTA가 조용히 랜딩만 새로고침하게 된다.
// 로컬/프리뷰 빌드(CF_PAGES 미설정)는 placeholder를 그대로 허용해 개발을 막지 않는다.
function cfPagesPlaceholderGuard(): Plugin {
  return {
    name: 'teno-cf-pages-placeholder-guard',
    buildStart() {
      if (!process.env.CF_PAGES) return;
      const remaining = PLACEHOLDER_URLS.filter(isPlaceholder);
      if (remaining.length > 0) {
        throw new Error(
          `[teno-landing] links.ts still has placeholder URLs for a Cloudflare Pages build: ${remaining.join(', ')}. Fill them in before deploying.`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), prerender(), cfPagesPlaceholderGuard()],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        docs: 'docs.html',
        privacy: 'privacy.html',
        terms: 'terms.html',
      },
    },
  },
});
