/**
 * 봇 출력 JSON -> 디스코드처럼 보이는 HTML. 레거시 임베드와 컨테이너 V2 둘 다 받는다.
 * discohook 공유 URL 포맷은 문서화돼 있지 않아 한 번 틀렸다 — 남의 포맷을 맞추느니 직접 그린다.
 */
import { ComponentType } from 'discord.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Field {
  name: string;
  value: string;
  inline?: boolean;
}

interface Embed {
  title?: string;
  url?: string;
  description?: string;
  color?: number;
  fields?: Field[];
  thumbnail?: { url: string };
  image?: { url: string };
  footer?: { text: string; icon_url?: string };
  author?: { name: string; url?: string; icon_url?: string };
  timestamp?: string;
}

/** V2 컴포넌트는 종류마다 필드가 다르다 — 미리보기에는 한 덩어리로 받는 게 싸다 */
interface Component {
  type: ComponentType;
  content?: string;
  components?: Component[];
  accessory?: Component;
  media?: { url: string };
  divider?: boolean;
  spacing?: number;
  label?: string;
  style?: number;
  disabled?: boolean;
}

interface Container {
  type: ComponentType.Container;
  accent_color?: number;
  components: Component[];
}

const escape = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[
        char
      ] as string,
  );

/** <t:초:스타일> — 디스코드가 클라이언트 로케일로 그리는 부분이라 여기서 안 풀면 회귀가 안 보인다 */
const timestamp = (seconds: string, style = 'f') => {
  const at = dayjs.unix(Number(seconds));
  const formats: Record<string, string> = {
    t: 'HH:mm',
    T: 'HH:mm:ss',
    d: 'YYYY-MM-DD',
    D: 'YYYY년 M월 D일',
    f: 'YYYY년 M월 D일 HH:mm',
    F: 'dddd, YYYY년 M월 D일 HH:mm',
  };
  return style === 'R' ? at.fromNow() : at.format(formats[style] ?? formats.f);
};

const inline = (text: string) =>
  escape(text)
    .replace(
      /&lt;t:(\d+)(?::([tTdDfFR]))?&gt;/g,
      (_, s: string, f: string) => `<span class="ts">${timestamp(s, f)}</span>`,
    )
    .replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1">$1</a>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/```([\s\S]+?)```/g, '<pre>$1</pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/__([^_\n]+)__/g, '<u>$1</u>');

/** 줄 맨 앞에서만 먹는 것들. V2는 제목도 `##`이라 이걸 안 풀면 전부 본문 크기로 보인다 */
const PREFIX = /^(#{1,3}|-#) (.*)$/;

const markdown = (text: string) => {
  // 코드블록은 줄을 넘나들어 줄 단위로 자르면 깨진다
  if (text.includes('```')) return inline(text).replace(/\n/g, '<br>');

  let html = '';
  let afterBlock = true;
  for (const raw of text.split('\n')) {
    const match = PREFIX.exec(raw);
    if (match) {
      const style = match[1] === '-#' ? 'sub' : `h${match[1].length}`;
      html += `<div class="${style}">${inline(match[2])}</div>`;
    } else {
      html += (afterBlock ? '' : '<br>') + inline(raw);
    }
    afterBlock = Boolean(match);
  }
  return html;
};

/** inline 필드는 연속된 것끼리 최대 3개씩 한 줄 — 디스코드 실제 배치 규칙 */
const rows = (fields: Field[]) =>
  fields.reduce<Field[][]>((acc, field) => {
    const last = acc.at(-1);
    if (field.inline && last?.[0]?.inline && last.length < 3) last.push(field);
    else acc.push([field]);
    return acc;
  }, []);

const hex = (color = 0x2b2d31) => `#${color.toString(16).padStart(6, '0')}`;

const renderButton = (component: Component) =>
  `<span class="btn s${component.style ?? 2}${component.disabled ? ' off' : ''}">${escape(component.label ?? '')}</span>`;

const renderComponent = (component: Component): string => {
  switch (component.type) {
    case ComponentType.TextDisplay:
      return `<div class="text">${markdown(component.content ?? '')}</div>`;

    case ComponentType.Section: {
      const accessory = component.accessory;
      const side =
        accessory?.type === ComponentType.Thumbnail
          ? `<img class="thumb" src="${escape(accessory.media?.url ?? '')}">`
          : accessory
            ? renderButton(accessory)
            : '';
      const body = (component.components ?? []).map(renderComponent).join('');
      return `<div class="section"><div class="body">${body}</div>${side}</div>`;
    }

    // divider:false는 선 없이 간격만 벌린다
    case ComponentType.Separator:
      return `<div class="sep${component.spacing === 2 ? ' large' : ''}${component.divider === false ? ' blank' : ''}"></div>`;

    case ComponentType.ActionRow:
      return `<div class="btns">${(component.components ?? []).map(renderButton).join('')}</div>`;

    default:
      return '';
  }
};

const renderEmbed = (embed: Embed) => {
  const present = (embed.fields ?? []).filter((f) => f.name && f.value);
  const fields = present.length
    ? `<div class="fields">${rows(present)
        .map(
          (row) =>
            `<div class="row">${row
              .map(
                (f) =>
                  `<div class="field"><div class="fname">${markdown(f.name)}</div>` +
                  `<div class="fvalue">${markdown(f.value)}</div></div>`,
              )
              .join('')}</div>`,
        )
        .join('')}</div>`
    : '';

  const title = embed.title
    ? embed.url
      ? `<a class="title link" href="${escape(embed.url)}">${markdown(embed.title)}</a>`
      : `<div class="title">${markdown(embed.title)}</div>`
    : '';

  return `<div class="embed" style="border-left-color:${hex(embed.color)}">
  <div class="body">
    ${embed.author ? `<div class="author">${embed.author.icon_url ? `<img src="${escape(embed.author.icon_url)}">` : ''}${markdown(embed.author.name)}</div>` : ''}
    ${title}
    ${embed.description ? `<div class="desc">${markdown(embed.description)}</div>` : ''}
    ${fields}
  </div>
  ${embed.thumbnail ? `<img class="thumb" src="${escape(embed.thumbnail.url)}">` : '<div></div>'}
  ${embed.image ? `<img class="image" src="${escape(embed.image.url)}">` : ''}
  ${embed.footer ? `<div class="footer">${embed.footer.icon_url ? `<img src="${escape(embed.footer.icon_url)}">` : ''}${escape(embed.footer.text)}${embed.timestamp ? ` • ${dayjs(embed.timestamp).format('YYYY-MM-DD HH:mm')}` : ''}</div>` : ''}
</div>`;
};

const renderContainer = (view: Container) =>
  `<div class="container" style="border-left-color:${hex(view.accent_color)}">
  ${view.components.map(renderComponent).join('\n  ')}
</div>`;

export function renderMessage(view: Embed | Container, label: string) {
  const body =
    'type' in view && view.type === ComponentType.Container
      ? renderContainer(view)
      : renderEmbed(view as Embed);

  // 폭·색·간격은 디스코드 데스크톱 실측값 (docs/design_handoff_discord_embeds)
  return `<!doctype html><meta charset="utf-8"><title>${escape(label)}</title>
<style>
  body { background:#313338; color:#dbdee1; margin:0; padding:24px;
         font:400 14px/1.375 "gg sans","Segoe UI",Roboto,sans-serif; }
  .label { color:#949ba4; font-size:12px; margin-bottom:12px; }
  .embed { max-width:520px; background:#2b2d31; border-radius:4px;
           border-left:4px solid; padding:12px 16px 16px; position:relative;
           display:grid; grid-template-columns:1fr auto; column-gap:16px; }
  .body { min-width:0; }
  .author { display:flex; align-items:center; gap:8px; margin-bottom:8px;
            font-weight:600; font-size:14px; color:#f2f3f5; }
  .author img { width:24px; height:24px; border-radius:50%; }
  .title { font-weight:600; font-size:16px; color:#f2f3f5; margin-bottom:8px; }
  .link { color:#00a8fc; text-decoration:none; }
  .link:hover { text-decoration:underline; }
  .desc { margin-bottom:8px; white-space:normal; }
  .fields { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
  .row { display:flex; gap:8px; }
  .field { flex:1; min-width:0; }
  .fname { font-weight:600; color:#f2f3f5; margin-bottom:2px; }
  .fvalue { color:#dbdee1; }
  .thumb { width:80px; height:80px; object-fit:contain; border-radius:4px; }
  .image { margin-top:16px; max-width:100%; border-radius:4px; grid-column:1/-1; }
  .footer { grid-column:1/-1; display:flex; align-items:center; gap:8px;
            margin-top:8px; font-size:12px; color:#949ba4; }
  .footer img { width:20px; height:20px; border-radius:50%; }
  .ts { background:#3f4248; border-radius:3px; padding:0 2px; }
  code { background:#1e1f22; border-radius:3px; padding:1px 3px; font-size:13px; }
  pre { background:#1e1f22; border:1px solid #2b2d31; border-radius:4px;
        padding:8px; overflow-x:auto; }
  a { color:#00a8fc; }

  .container { width:516px; box-sizing:border-box; background:#2b2d31; border-radius:4px;
               border-left:4px solid; padding:16px;
               display:flex; flex-direction:column; gap:8px; }
  .container .text { font-size:16px; }
  .container strong { font-weight:600; color:#f2f3f5; }
  .section { display:flex; gap:16px; align-items:flex-start; }
  .section .body { flex:1; }
  .h1 { font-weight:700; font-size:24px; color:#f2f3f5; }
  .h2 { font-weight:700; font-size:20px; color:#f2f3f5; }
  .h3 { font-weight:600; font-size:16px; color:#f2f3f5; }
  .sub { font-size:12.8px; color:#949ba4; }
  .sep { height:1px; background:#3f4147; margin:8px 0; }
  .sep.large { margin:16px 0; }
  .sep.blank { background:none; }
  .btns { display:flex; gap:8px; flex-wrap:wrap; }
  .btn { padding:9px 16px; border-radius:3px; font-weight:500; color:#fff; background:#4e5058; }
  .btn.s1 { background:#5865f2; }
  .btn.s3 { background:#248046; }
  .btn.s4 { background:#da373c; }
  .btn.off { opacity:.5; }
</style>
<div class="label">${escape(label)}</div>
${body}
`;
}
