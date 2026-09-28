import { IncarnonPerk, IncarnonTier, IncarnonWeapon } from './types';

/** 손으로 쓴 위키텍스트라 표기가 제각각이다 — 정규식은 45개 페이지 전부에 맞춘 것이니 고치면 스펙 픽스처부터 늘릴 것 */

/** 표 헤더에서 변종 열 이름을 뽑을 때는 **첫 인자**(실제 무기명)를 쓴다 — 두 번째는 'Prime' 같은 축약 라벨이다 */
const HEADER_WEAPON = /\{\{Weapon\|([^|}]+)/g;

/** 헤더 행 판별. `! ... | Evolution` 으로 끝나는 줄이다. 'Evolution Challenge' 행과 구분하려고 줄 끝을 본다 */
const HEADER_ROW = /^!.*\|\s*Evolution\s*$/m;

/** `! EVO2` / `! rowspan="3" | EVO3`. 원문에 `rowspan="2` 처럼 따옴표가 안 닫힌 행이 섞여 있어 닫는 따옴표를 강제하지 않는다 */
const TIER_ROW = /^\s*!\s*(?:rowspan="?\d+"?\s*\|\s*)?EVO\s*(\d)/m;

/** 해금 조건. `!! colspan="5" |` 형태와 줄바꿈 뒤 `!` 형태 둘 다 쓰인다 */
const CHALLENGE_ROW =
  /Evolution Challenge\s*\n?\s*!!?\s*(?:colspan="?\d+"?\s*\|)?\s*(.*)/;

/** 퍽 이름은 굵게 또는 맨 텍스트 'Incarnon Form'. 아포스트로피(Void's Guidance) 때문에 비탐욕으로 끊는다 */
const PERK_CELL =
  /\n\|\s*(?:style="[^"]*"\s*\|\s*)?(?:'''(.+?)'''|(Incarnon Form))\s*\[\[File:([^|\]]+)/;

/** 셀 구분자. `||` 는 같은 줄 셀 구분이라 제외한다 */
const CELL = /\n\|(?!\|)/;

/** 1~2단계 불릿만. 3단계(`***`)는 퍽 효과가 아니라 세부 주석이라 버린다 */
const BULLET = /^\*{1,2}(?!\*)/;

/** 값 셀의 `X = 24<br>Y = 30`. 열마다 값이 다르므로 어느 셀을 읽느냐가 곧 어느 변종이냐다 */
const ASSIGNMENT = /\b([XYZ])\s*=\s*([^<\n|]+)/g;

/** 입문용 열화판. 열 순서상 뒤에 놓여도 최상위가 아니다 */
const STARTER_VARIANT = /^Mk-?1/i;

const PLACEHOLDER = /\b([XYZ])\b/g;

/** 템플릿은 마지막 인자가 표시 텍스트, 인자 없는 템플릿({{clr}})은 레이아웃용이라 지운다 */
const displayText = (raw: string) =>
  raw
    .replace(/\[\[[^[\]|]*\|([^[\]]*)\]\]/g, '$1')
    .replace(/\[\[([^[\]]*)\]\]/g, '$1')
    .replace(/\{\{([^{}]*)\}\}/g, (_, body: string) => {
      const args = body.split('|');
      return args.length > 1 ? args[args.length - 1].trim() : '';
    })
    .replace(/'''|''/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** 퍽 셀 뒤에 오는 셀들 = [효과, 변종별 값 …, 비고] */
const cellsAfterPerk = (row: string, perkMatch: RegExpMatchArray) => {
  const tail = row.slice(row.indexOf(perkMatch[0]) + perkMatch[0].length);
  // 첫 조각은 퍽 셀의 나머지(`|64px|center]]`)라 버린다
  return tail.split(CELL).slice(1);
};

const substitutions = (valueCell: string) =>
  new Map(
    [...valueCell.matchAll(ASSIGNMENT)].map(([, key, value]) => [
      key,
      value.trim(),
    ]),
  );

/** 보통 마지막 열이지만 Mk1은 열화판이라 건너뛴다(Furis·Kunai는 기본형이 최상위) */
const referenceIndex = (columns: string[]) => {
  for (let index = columns.length - 1; index >= 0; index -= 1)
    if (!STARTER_VARIANT.test(columns[index])) return index;
  return 0;
};

const parsePerk = (
  row: string,
  perkMatch: RegExpMatchArray,
  column: number,
): IncarnonPerk => {
  const cells = cellsAfterPerk(row, perkMatch);
  // cells[0]이 효과 셀이라 값 셀은 1칸 밀려 있다. 없으면(colspan으로 뭉뚱그려진 퍽) 치환표가 빈다
  const table = substitutions(cells[1 + column] ?? '');

  const effect = (cells[0] ?? '')
    .split('\n')
    .filter((line) => BULLET.test(line.trim()))
    .map((line) => displayText(line.trim().replace(/^\*+/, '')))
    .filter(Boolean)
    .map((line) =>
      line.replace(
        PLACEHOLDER,
        (match, key: string) => table.get(key) ?? match,
      ),
    );

  return { name: perkMatch[1] ?? perkMatch[2], icon: perkMatch[3], effect };
};

/** 아래 절(Known Bugs·Patch History)의 표·불릿이 퍽으로 잡히지 않게 Evolutions 절만 자른다 */
export const evolutionsSection = (content: string) =>
  content.split(/===\s*Evolutions\s*===/)[1]?.split(/\n==[^=]/)[0] ?? '';

export const parseEvolutions = (wikitext: string): IncarnonWeapon => {
  const rows = wikitext.split(/\n\|-/);
  const header = rows.find((row) => HEADER_ROW.test(row)) ?? rows[1] ?? '';
  const columns = [...header.matchAll(HEADER_WEAPON)].map(([, name]) =>
    name.trim(),
  );
  const column = referenceIndex(columns);

  const tiers: IncarnonTier[] = [];
  /** 챌린지 행은 여는 티어보다 **앞에** 놓인다 — 다음 EVO 행을 만날 때 붙인다 */
  let pendingChallenge: string | undefined;

  for (const row of rows) {
    const tierMatch = row.match(TIER_ROW);
    if (tierMatch) {
      tiers.push({
        evolution: Number(tierMatch[1]),
        challenge: pendingChallenge,
        perks: [],
      });
      pendingChallenge = undefined;
    }

    const perkMatch = row.match(PERK_CELL);
    if (perkMatch) tiers.at(-1)?.perks.push(parsePerk(row, perkMatch, column));

    const challengeMatch = row.match(CHALLENGE_ROW);
    if (challengeMatch) pendingChallenge = displayText(challengeMatch[1]);
  }

  return { reference: columns[column], tiers };
};
