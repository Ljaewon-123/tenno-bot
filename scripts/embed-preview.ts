/**
 * 임베드를 봇 없이 렌더링해 본다.
 * 봇을 띄우고 디스코드에서 커맨드를 치는 왕복이 임베드 한 줄 고칠 때마다 붙어서
 * 눈으로 확인하는 비용이 코드 고치는 비용보다 컸다 — 빌더는 순수 함수라 게이트웨이가 필요 없다.
 *
 * 사용: npm run embed [메서드] [인자...]
 */
import { WarframeApiService } from '@/warframe-api/warframe-api.service';
import { WfcdItemsService } from '@/warframe-api/wfcd-items/wfcd-items.service';
import Items from '@wfcd/items';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderEmbed } from './render-embed';

const get = (path: string) =>
  fetch(`https://api.warframestat.us/${path}`).then((res) => res.json());

// WorldStateService 대역 — 캐시 레이어(=DB)만 걷어내고 같은 엔드포인트를 그대로 친다
const worldState = {
  archonHunt: () => get('pc/archonHunt'),
  sortie: () => get('pc/sortie'),
  events: () => get('pc/events'),
  voidTrader: () => get('pc/voidTrader'),
  nightwave: () => get('pc/nightwave'),
  archimedeas: () => get('pc/archimedeas'),
  cycle: (name: string) => get(`pc/${name}Cycle`),
  voidFissures: async (tiers?: string[]) => {
    const all = (await get('pc/fissures')) as { tier: string }[];
    return tiers?.length ? all.filter((f) => tiers.includes(f.tier)) : all;
  },
};

// i18n 번들은 무겁고 임베드 이미지 경로에는 쓰이지 않는다
const service = new WarframeApiService(
  worldState as never,
  new WfcdItemsService(new Items({ category: ['All'] })),
  {} as never,
);

type EmbedBuild = (...args: string[]) => Promise<{ data: object }>;

const [method = 'cycles', ...args] = process.argv.slice(2);
// apply/call은 strictBindCallApply:false 탓에 any로 떨어진다 — 인덱싱 호출로 this까지 같이 묶는다
const builders = service as unknown as Record<string, EmbedBuild | undefined>;

if (typeof builders[method] !== 'function') {
  const names = Object.getOwnPropertyNames(WarframeApiService.prototype).filter(
    (name) => name !== 'constructor',
  );
  console.error(`unknown: ${method}
available: ${names.join(', ')}`);
  process.exit(1);
}

const OUT = resolve(__dirname, '.embed-preview.html');

void builders[method](...args)
  .then((embed) => {
    console.log(JSON.stringify(embed.data, null, 2));

    writeFileSync(OUT, renderEmbed(embed.data, `${method} ${args.join(' ')}`));
    console.log(`
> ${OUT}`);

    // 열기 실패해도 위 경로를 직접 열면 되므로 죽이지 않는다
    const [cmd, cmdArgs]: [string, string[]] =
      process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', OUT]]
        : process.platform === 'darwin'
          ? ['open', [OUT]]
          : ['xdg-open', [OUT]];
    spawn(cmd, cmdArgs, { detached: true, stdio: 'ignore' })
      .on('error', () => {})
      .unref();
  })
  .catch((error: Error) => {
    console.error(error.message);
    process.exit(1);
  });
