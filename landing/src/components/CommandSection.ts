import { html, type RawHtml } from '../lib/html.ts';
import { Chip } from './Chip.ts';
import { OptionTable } from './OptionTable.ts';
import { TipBubble } from './TipBubble.ts';
import { CATEGORY_LABEL, CATEGORY_TONE, type Command, type Subcommand } from '../data/commands.ts';

function ExampleBlock(text: string): RawHtml {
  return html`<div class="flex flex-col gap-2">
    <div class="text-xs font-bold text-text-faint">Example</div>
    <pre class="whitespace-pre-wrap rounded-2xl bg-code px-5 py-4.5 font-mono text-[15px] leading-relaxed text-text">${text}</pre>
  </div>`;
}

/** 옵션이 없으면 문장 끝에 "No options."을 붙인다 — 목업의 /alarm list와 같은 패턴 */
function describeOptions(description: string, hasOptions: boolean): string {
  return hasOptions ? description : `${description} No options.`;
}

function SubcommandBlock(commandId: string, sub: Subcommand): RawHtml {
  return html`<section id="${commandId}-${sub.id}" class="flex flex-col gap-4">
    <h2 class="font-display text-2xl font-bold text-text">${sub.name}</h2>
    <p class="text-lg leading-relaxed text-text-muted">${describeOptions(sub.description, sub.options.length > 0)}</p>
    ${sub.options.length ? OptionTable({ options: sub.options }) : ''}
    ${sub.example ? ExampleBlock(sub.example) : ''}
  </section>`;
}

// 그룹 커맨드(subcommands 있음)는 상단에 그룹 설명 한 번 + 서브커맨드별 섹션,
// 단일 커맨드는 상단 문단에 바로 옵션 유무를 붙인다 — 목업의 /alarm 페이지 구조를 그대로 따른다.
export function CommandSection(command: Command): RawHtml {
  const hasGroup = Boolean(command.subcommands?.length);
  const topOptions = command.options ?? [];

  return html`<section id="${command.id}" class="flex flex-col gap-9 border-t border-border pt-10 first:border-t-0 first:pt-0">
    <div class="flex flex-col gap-3.5">
      ${Chip({ label: CATEGORY_LABEL[command.category], tone: CATEGORY_TONE[command.category] })}
      <h1 class="font-display text-4xl font-extrabold text-text sm:text-5xl">/${command.id}</h1>
      <p class="max-w-2xl text-lg leading-relaxed text-text-muted sm:text-xl">
        ${hasGroup ? command.description : describeOptions(command.description, topOptions.length > 0)}
      </p>
    </div>
    ${command.tip ? TipBubble({ text: command.tip }) : ''}
    ${!hasGroup && topOptions.length ? OptionTable({ options: topOptions }) : ''}
    ${!hasGroup && command.example ? ExampleBlock(command.example) : ''}
    ${hasGroup ? command.subcommands!.map((sub) => SubcommandBlock(command.id, sub)) : ''}
  </section>`;
}
