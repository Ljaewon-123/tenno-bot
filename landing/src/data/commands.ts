import type { ChipTone } from './types.ts';

// 실제 봇이 등록하는 커맨드만 옮긴다 — src/slash-command/**과 그 DTO들이 소스 오브 트루스.
// 목업(Docs2.dc.html)의 문구·순서와 코드가 다르면 코드를 따른다(태스크 브리프 지시).

export type CommandCategory = 'intel' | 'loot' | 'ops' | 'comms' | 'squad';

export const CATEGORY_LABEL: Record<CommandCategory, string> = {
  intel: 'Intel',
  loot: 'Loot',
  ops: 'Ops',
  comms: 'Comms',
  squad: 'Squad',
};

// ChipTone과 CommandCategory가 같은 이름 집합이라 그대로 재사용 — 타입만 좁혀 컴파일 타임에 보장한다.
export const CATEGORY_TONE: Record<CommandCategory, ChipTone> = {
  intel: 'intel',
  loot: 'loot',
  ops: 'ops',
  comms: 'comms',
  squad: 'squad',
};

export type CommandOptionType = 'string' | 'integer' | 'boolean' | 'choice';

export interface CommandOption {
  name: string;
  type: CommandOptionType;
  required: boolean;
  description: string;
  /** EnumOption/StringOption의 choices — 실제로 유저가 고르는 값(표시 라벨) 그대로 */
  choices?: string[];
}

export interface Subcommand {
  /** 앵커 id는 `${command.id}-${id}` — 단일 페이지라 커맨드 간에도 겹치면 안 된다 */
  id: string;
  name: string;
  description: string;
  options: CommandOption[];
  example?: string;
}

export interface Command {
  /** 슬래시 커맨드 이름. 앵커 id로도 쓴다 */
  id: string;
  category: CommandCategory;
  description: string;
  /** 코드에서 확인되는 실제 제약(길드 전용 등)만 — 목업의 /alarm 문구 외에는 근거가 있을 때만 추가 */
  tip?: string;
  options?: Subcommand['options'];
  example?: string;
  subcommands?: Subcommand[];
}

export const GETTING_STARTED: { id: string; label: string }[] = [
  { id: 'intro', label: 'Introduction' },
  { id: 'invite', label: 'Invite & permissions' },
  { id: 'timezones', label: 'Timezones' },
];

// 순서: 브리프가 못 박은 8개(Intel)/3개(Loot)/2개(Ops&comms)/1개(Squad)는 그 순서를 그대로 따르고,
// 목업에 없는 나머지(help/status/shockwave)는 코드가 등록하니 뺄 수 없어 Intel 끝에 덧붙인다.
export const COMMANDS: Command[] = [
  // --- Intel ---
  {
    id: 'help',
    category: 'intel',
    description: 'List all commands',
  },
  {
    id: 'status',
    category: 'intel',
    description: "Check the Warframe data API's status",
  },
  {
    id: 'feedback',
    category: 'intel',
    description: 'Send a bug report or idea to the developer',
    options: [
      { name: 'message', type: 'string', required: true, description: 'Bug report, idea, or anything else' },
    ],
    example: '/feedback message:"Add arbitration alarms please"',
  },
  {
    id: 'sortie',
    category: 'intel',
    description: 'Get the current Sortie information',
  },
  {
    id: 'archon-hunt',
    category: 'intel',
    description: 'Get the current Archon Hunt information',
  },
  {
    id: 'void-fissures',
    category: 'intel',
    description: 'Get the current Void Fissures information',
    options: [
      {
        name: 'tier',
        type: 'choice',
        required: false,
        description: 'Filter by relic tier',
        choices: ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem', 'Omnia'],
      },
      {
        name: 'steel-path',
        type: 'boolean',
        required: false,
        description: 'Only Steel Path fissures',
      },
    ],
    example: '/void-fissures tier:Axi steel-path:true',
  },
  {
    id: 'cycles',
    category: 'intel',
    description: 'Get the current open world day/night cycles',
  },
  {
    id: 'nightwave',
    category: 'intel',
    description: 'Get the current Nightwave challenges',
  },
  {
    id: 'shockwave',
    category: 'intel',
    description: 'Get the current Nightwave challenges (alias of /nightwave)',
  },
  {
    id: 'archimedea',
    category: 'intel',
    description: 'Get the current Deep and Temporal Archimedea',
    options: [
      {
        name: 'type',
        type: 'choice',
        required: false,
        description: 'Filter by Archimedea type',
        choices: ['Deep Archimedea', 'Temporal Archimedea'],
      },
      {
        name: 'detail',
        type: 'boolean',
        required: false,
        description: 'Show what each deviation and risk variable does',
      },
    ],
    example: '/archimedea type:"Deep Archimedea" detail:true',
  },
  {
    id: 'events',
    category: 'intel',
    description: 'Get the current Events information',
  },
  {
    id: 'void-trader',
    category: 'intel',
    description: "Get the current Void Trader (Baro Ki'Teer) information",
  },

  // --- Loot ---
  {
    id: 'drop',
    category: 'loot',
    description: 'Find where an item drops from',
    options: [
      {
        name: 'item',
        type: 'string',
        required: true,
        description: 'Get the drop sources of an item',
      },
      {
        name: 'category',
        type: 'choice',
        required: false,
        description: 'Filter drop sources by category',
        choices: [
          'mission',
          'relic',
          'transient',
          'enemy',
          'sortie',
          'key',
          'bounty',
          'syndicate',
          'avatar',
          'trader',
        ],
      },
    ],
    example: '/drop item:"Forma Blueprint" category:relic',
  },
  {
    id: 'relic',
    category: 'loot',
    description: 'Show everything that drops from one relic',
    options: [
      {
        name: 'name',
        type: 'string',
        required: true,
        description: 'Show everything that drops from one relic',
      },
    ],
    example: '/relic name:"Meso V1"',
  },
  {
    id: 'incarnon',
    category: 'loot',
    description: 'Get this week Incarnon Genesis rotation, or one weapon detail',
    options: [
      {
        name: 'weapon',
        type: 'string',
        required: false,
        description: 'Show evolutions and install cost for one Incarnon Genesis',
      },
    ],
    example: '/incarnon weapon:Braton',
  },

  // --- Ops & comms ---
  {
    id: 'alarm',
    category: 'ops',
    description: 'Manage repeating Warframe info alarms',
    tip: 'Requires the Manage Channels permission. Alarms post in the channel where you run the command, and only work inside a server.',
    subcommands: [
      {
        id: 'register',
        name: 'register',
        description: 'Register a new alarm',
        options: [
          { name: 'name', type: 'string', required: true, description: 'Alarm name' },
          {
            name: 'target',
            type: 'choice',
            required: true,
            description: 'Warframe info to send',
            choices: [
              'archon-hunt',
              'sortie',
              'events',
              'void-fissures',
              'void-trader',
              'cycles',
              'nightwave',
              'archimedea',
            ],
          },
          {
            name: 'interval-minutes',
            type: 'integer',
            required: true,
            description: 'Repeat interval in minutes',
          },
          {
            name: 'tier',
            type: 'choice',
            required: false,
            description: 'Void fissure tier (void-fissures target only)',
            choices: ['Lith', 'Meso', 'Neo', 'Axi', 'Requiem', 'Omnia'],
          },
          {
            name: 'timezone',
            type: 'choice',
            required: false,
            description: 'Timezone (defaults to your locale)',
            choices: ['Asia/Seoul', 'Asia/Tokyo', 'UTC', 'America/New_York', 'America/Los_Angeles'],
          },
          { name: 'description', type: 'string', required: false, description: 'Alarm description' },
        ],
        example: '/alarm register name:axi-ping target:void-fissures interval-minutes:30 tier:Axi',
      },
      {
        id: 'delete',
        name: 'delete',
        description: 'Delete an existing alarm',
        options: [{ name: 'id', type: 'string', required: true, description: 'Alarm id to delete' }],
        example: '/alarm delete id:a1b2c3',
      },
      {
        id: 'list',
        name: 'list',
        description: 'Show alarms in this server',
        options: [],
      },
    ],
  },
  {
    id: 'notification',
    category: 'comms',
    description: 'Subscribe this server to Warframe worldstate updates',
    tip: 'Requires the Manage Server permission, and only works inside a server.',
    subcommands: [
      {
        id: 'on',
        name: 'on',
        description: 'Send this event to the current channel when it changes',
        options: [
          {
            name: 'event',
            type: 'choice',
            required: true,
            description: 'Warframe event to notify about',
            choices: ['sortie', 'archon-hunt', 'events', 'void-trader', 'nightwave', 'archimedea'],
          },
        ],
        example: '/notification on event:sortie',
      },
      {
        id: 'off',
        name: 'off',
        description: 'Stop notifications for this event',
        options: [
          {
            name: 'event',
            type: 'choice',
            required: true,
            description: 'Warframe event to notify about',
            choices: ['sortie', 'archon-hunt', 'events', 'void-trader', 'nightwave', 'archimedea'],
          },
        ],
        example: '/notification off event:sortie',
      },
      {
        id: 'list',
        name: 'list',
        description: 'Show this server subscriptions',
        options: [],
      },
    ],
  },

  // --- Squad ---
  {
    id: 'party',
    category: 'squad',
    description: 'Recruit a squad',
    tip: 'Party recruiting only works inside a server.',
    subcommands: [
      {
        id: 'create',
        name: 'create',
        description: 'Open a new party',
        options: [
          { name: 'name', type: 'string', required: true, description: 'Party name' },
          { name: 'mission', type: 'string', required: true, description: 'Mission to run' },
          { name: 'size', type: 'integer', required: false, description: 'Party size (default 4)' },
          {
            name: 'visibility',
            type: 'choice',
            required: false,
            description: 'Who you are recruiting (label only — anyone can still enter)',
            choices: ['public', 'friends', 'clan'],
          },
        ],
        example: '/party create name:"Steel Path ESO" mission:"Mot (Void) — Survival" size:4 visibility:public',
      },
      {
        id: 'list',
        name: 'list',
        description: 'Show open parties',
        options: [],
      },
      {
        id: 'history',
        name: 'history',
        description: 'Show recently closed parties',
        options: [],
      },
    ],
  },
];

export interface SidebarSection {
  title: string;
  /** 점 색으로 대표할 카테고리 — "Ops & comms"처럼 카테고리 둘을 한 섹션으로 묶을 때도 값은 카테고리 하나다.
   * 클래스 문자열이 아니라 카테고리를 두는 이유: data/*는 의미만 담고, 카테고리→Tailwind 클래스 매핑은
   * 컴포넌트 계층(Chip.ts의 DOT_CLASSES)이 가진다. */
  dotCategory: CommandCategory;
  commands: Command[];
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  { title: 'Intel', dotCategory: 'intel', commands: COMMANDS.filter((c) => c.category === 'intel') },
  { title: 'Loot', dotCategory: 'loot', commands: COMMANDS.filter((c) => c.category === 'loot') },
  {
    title: 'Ops & comms',
    dotCategory: 'ops',
    commands: COMMANDS.filter((c) => c.category === 'ops' || c.category === 'comms'),
  },
  { title: 'Squad', dotCategory: 'squad', commands: COMMANDS.filter((c) => c.category === 'squad') },
];
