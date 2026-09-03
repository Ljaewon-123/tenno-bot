/**
 * 임베드 JSON -> 디스코드처럼 보이는 HTML.
 * discohook 공유 URL 포맷은 문서화돼 있지 않아 한 번 틀렸다 — 남의 포맷을 맞추느니 직접 그린다.
 */
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

const markdown = (text: string) =>
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
    .replace(/__([^_\n]+)__/g, '<u>$1</u>')
    .replace(/\n/g, '<br>');

/** inline 필드는 연속된 것끼리 최대 3개씩 한 줄 — 디스코드 실제 배치 규칙 */
const rows = (fields: Field[]) =>
  fields.reduce<Field[][]>((acc, field) => {
    const last = acc.at(-1);
    if (field.inline && last?.[0]?.inline && last.length < 3) last.push(field);
    else acc.push([field]);
    return acc;
  }, []);

export function renderEmbed(embed: Embed, label: string) {
  const color = `#${(embed.color ?? 0x2b2d31).toString(16).padStart(6, '0')}`;

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

  return `<!doctype html><meta charset="utf-8"><title>${escape(label)}</title>
<style>
  body { background:#313338; color:#dbdee1; margin:0; padding:24px;
         font:400 14px/1.375 "gg sans","Segoe UI",Roboto,sans-serif; }
  .label { color:#949ba4; font-size:12px; margin-bottom:12px; }
  .embed { max-width:520px; background:#2b2d31; border-radius:4px;
           border-left:4px solid ${color}; padding:12px 16px 16px; position:relative;
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
</style>
<div class="label">${escape(label)}</div>
<div class="embed">
  <div class="body">
    ${embed.author ? `<div class="author">${embed.author.icon_url ? `<img src="${escape(embed.author.icon_url)}">` : ''}${markdown(embed.author.name)}</div>` : ''}
    ${title}
    ${embed.description ? `<div class="desc">${markdown(embed.description)}</div>` : ''}
    ${fields}
  </div>
  ${embed.thumbnail ? `<img class="thumb" src="${escape(embed.thumbnail.url)}">` : '<div></div>'}
  ${embed.image ? `<img class="image" src="${escape(embed.image.url)}">` : ''}
  ${embed.footer ? `<div class="footer">${embed.footer.icon_url ? `<img src="${escape(embed.footer.icon_url)}">` : ''}${escape(embed.footer.text)}${embed.timestamp ? ` • ${dayjs(embed.timestamp).format('YYYY-MM-DD HH:mm')}` : ''}</div>` : ''}
</div>
`;
}
