import { describe, expect, it } from 'vitest';
import { parseEvolutions } from './wiki-parser';

/**
 * 위키텍스트 표 파싱. 여기가 틀리면 퍽 효과·해금 조건이 조용히 어긋난 채로 나간다 —
 * 수치가 한 변종 밀리거나 해금 조건이 한 티어 밀려도 화면상으론 멀쩡해 보인다.
 * 픽스처는 실제 페이지에서 잘라온 원문이다(파일 맨 아래).
 */
describe('parseEvolutions — 변종 열이 있는 표 (Braton)', () => {
  const parsed = parseEvolutions(BRATON);
  const perk = (evolution: number, name: string) =>
    parsed.tiers
      .find((tier) => tier.evolution === evolution)
      ?.perks.find((entry) => entry.name === name);

  it('마지막 열을 수치 기준 변종으로 잡는다', () => {
    // 표시용 라벨('Prime')이 아니라 템플릿 첫 인자를 쓴다 — 'Prime'만으론 어느 무기인지 모른다
    expect(parsed.reference).toBe('Braton Prime');
  });

  it('X·Y를 마지막 열 값으로 치환한다', () => {
    expect(perk(2, 'Daring Reverie')?.effect).toEqual([
      'Increase Base Damage by +4.',
      'With Channeled Ability active: Increase Base Damage by +38. +50% Ammo Efficiency',
    ]);
  });

  it('치환은 열마다 다른 값을 섞지 않는다', () => {
    // Braton 기본은 +14인데 Prime은 +2다 — 열을 잘못 잡으면 7배 틀린 수치가 나간다
    expect(perk(2, 'Munitions Grit')?.effect[0]).toBe(
      'Increase Base Damage by +2.',
    );
    expect(perk(3, 'Mercenary Chamber')?.effect[0]).toBe(
      'Increase Base Ammo Capacity to 1125.',
    );
  });

  it('값 열이 colspan으로 뭉뚱그려진 퍽은 치환할 게 없다', () => {
    expect(perk(3, "Void's Guidance")?.effect).toEqual([
      '+60% Accuracy',
      '-60% Recoil',
    ]);
  });

  it('아포스트로피가 든 퍽 이름을 자르지 않는다', () => {
    expect(perk(3, "Void's Guidance")?.icon).toBe(
      "EvolutionVoid'sGuidance.png",
    );
  });

  it('해금 조건을 다음 티어에 붙인다', () => {
    // 표에서 챌린지 행은 EVO1 '뒤'에 오지만 그건 EVO2를 여는 조건이다.
    // 설치하면 EVO1이 바로 열리므로 EVO1만 조건이 없다
    const challenge = (evolution: number) =>
      parsed.tiers.find((tier) => tier.evolution === evolution)?.challenge;
    expect(challenge(1)).toBeUndefined();
    expect(challenge(2)).toBe(
      'Complete a solo mission with this weapon equipped.',
    );
    expect(challenge(3)).toBe(
      "Kill 100 enemies with this weapon's Incarnon Form.",
    );
  });

  it('rowspan 따옴표가 안 닫힌 행도 티어로 읽는다', () => {
    // 원문이 rowspan="2 로 깨져 있다 — 위키 표기는 사람이 손으로 쓰는 것이라 이런 게 섞인다
    expect(parsed.tiers.map((tier) => tier.evolution)).toEqual([1, 2, 3]);
  });
});

describe('parseEvolutions — 변종 열이 없는 표 (Hate)', () => {
  const parsed = parseEvolutions(HATE);
  const tier = (evolution: number) =>
    parsed.tiers.find((entry) => entry.evolution === evolution);

  it('변종 열이 없으면 기준 변종도 없다', () => {
    expect(parsed.reference).toBeUndefined();
  });

  it('개행 뒤 ! 로 붙은 해금 조건도 읽는다', () => {
    // Braton은 '!! colspan=.. |', Hate는 줄바꿈 뒤 '!' — 같은 뜻인데 표기가 둘이다
    expect(tier(2)?.challenge).toBe(
      'Complete a solo mission with this weapon equipped',
    );
  });

  it('아포스트로피가 든 퍽 이름을 자르지 않는다', () => {
    expect(tier(2)?.perks.map((entry) => entry.name)).toEqual([
      "Swordsman's Flourish",
      "Stalker's Legacy",
    ]);
  });

  it('링크·템플릿을 걷어내고 표시 텍스트만 남긴다', () => {
    expect(tier(2)?.perks[1].effect).toEqual([
      'Increase Base Damage by +30.',
      'With Dread and Despair equipped: +30 Initial Combo.',
    ]);
  });

  it('2단계까지 중첩 불릿을 살린다', () => {
    // '+100% Melee Damage'는 하위 불릿이라 버리면 퍽 효과의 핵심이 통째로 사라진다
    expect(tier(1)?.perks[0].effect).toEqual([
      'Reach 6x Combo and then Heavy Attack to activate Incarnon Form.',
      'Forward and Neutral Combos embed explosive blades.',
      '+100% Melee Damage',
      '+20% Sprint Speed',
      '+20% to Parkour Velocity',
    ]);
  });
});

describe('parseEvolutions — 변종이 Mk1뿐인 표 (Furis)', () => {
  const parsed = parseEvolutions(FURIS);

  it('Mk1은 기준 변종으로 잡지 않는다', () => {
    // 위키 열 순서는 기본 → 변종 → 프라임이라 보통 마지막이 최상위지만,
    // Mk1은 입문용 열화판이라 뒤에 놓여도 최상위가 아니다 (Furis·Kunai 2개가 이 꼴)
    expect(parsed.reference).toBe('Furis');
  });

  it('Mk1 열의 값을 수치로 쓰지 않는다', () => {
    // Mk1-Furis는 +34, Furis는 +28 — 열을 안 거르면 약한 쪽 수치가 나간다
    expect(parsed.tiers[0].perks[0].effect[0]).toBe(
      'Increase Base Damage by +28.',
    );
  });
});

/** 실제 위키 원문에서 잘라온 표. 손대지 말 것 — 손대면 파서가 진짜 입력을 못 보게 된다 */
const BRATON = `

{{clr}}
{| class="wikitable sortable stickyHeader"
|+
|-
! colspan="3" | Evolution
! class=unsortable style="white-space: nowrap;" | {{Weapon|Braton}}
! class=unsortable style="white-space: nowrap;" | {{Weapon|Mk1-Braton|Mk1}} 
! class=unsortable style="white-space: nowrap;" | {{Weapon|Braton Vandal|Vandal}}
! class=unsortable style="white-space: nowrap;" | {{Weapon|Braton Prime|Prime}}
! class=unsortable | Notes
|-
! EVO1
| style="white-space: nowrap; text-align:center;" | Incarnon Form [[File:IncarnonFormAOEonHit.png|64px|center]] 
| 
* Weakpoint hits charge Incarnon Transmutation; Alt Fire transmutes. Switching back will expend any remaining charge.
* Gain Radial {{D|Heat}} damage.
| style="text-align:center;" colspan="4" | -
| 
* Incarnon Form has a '''3''' meter area of effect that deals pure {{D|Heat}} damage, with much higher [[Critical Chance]], [[Critical Multiplier]], and [[Status Chance]]. However, the [[Fire Rate]] is reduced, and the explosion possesses [[Damage Falloff]] from 100% to 90% from central impact.
* When modded for [[Punch Through]], the Incarnon Form's radial effect occurs at the first object struck, and only the main bullet punches through.
|-
! colspan="3" | Evolution Challenge !! colspan="5" | Complete a solo mission with this weapon equipped.
|-
! rowspan="2 | EVO2
| style="white-space: nowrap; text-align:center;" | '''Daring Reverie''' [[File:DamageAmmoEfficiencyDuringActiveChannelledAbility.png|64px|center]]
|
* Increase Base Damage by '''+X'''.
* With [[Channeled Abilities|Channeled Ability]] active: Increase Base Damage by '''+Y'''. '''+50%''' Ammo Efficiency
| style="text-align:center" | X = 24<br>Y = 30
| style="text-align:center" | X = 28<br>Y = 22
| style="text-align:center" | X = 12<br>Y = 34
| style="text-align:center" | X = 4<br>Y = 38
|
* Channeled Abilities must be draining energy to be considered active. Abilities that do not drain energy over time such as {{WF|Nekros|Nekros's}} {{A|Desecrate}}, {{WF|Hildryn|Hildryn's}} {{A|Haven}}, or {{WF|Sevagoth|Sevagoth's}} {{A|Gloom}} (with no enemies nearby) do not count.
|-
| style="white-space: nowrap; text-align:center;" | '''Munitions Grit''' [[File:MultishotCostsAmmoTakenFromPoolNotClip.png|64px|center]]
|
* Increase Base Damage by '''+X'''.
* Multishot consumes ammo directly from Capacity and does '''+Y''' Damage. '''+20%''' Multishot.
| style="text-align:center" | X = 14<br>Y = 60%
| style="text-align:center" | X = 20<br>Y = 48%
| style="text-align:center" | X = 8<br>Y = 58%
| style="text-align:center" | X = 2<br>Y = 54%
|
* Affects both modes. In the case of Incarnon Form, it pulls directly from its magazine.
* Damage bonus is a unique modifier that is multiplicative to other damage buffs.
* Damage bonus only applies to shots generated by multishot.
* The multishot bonus stacks additively with multishot mods such as {{M|Split Chamber}}.
|-
! colspan="3" | Evolution Challenge !! colspan="5" | Kill '''100''' enemies with this weapon's Incarnon Form.
|-
! rowspan="3" | EVO3
| style="white-space: nowrap; text-align:center;" | '''Mercenary Chamber''' [[File:IncarnonAmmoPool.png|64px|center]]
| 
* Increase Base Ammo Capacity to '''X'''.
| style="text-align:center" | X = 675
| style="text-align:center" | X = 600
| style="text-align:center" | X = 750
| style="text-align:center" | X = 1125
|
* The bonus does not apply to the Incarnon form.
|-
| style="white-space: nowrap; text-align:center;" | '''Void's Guidance''' [[File:EvolutionVoid'sGuidance.png|64px|center]]
| 
* '''+60%''' Accuracy
* '''-60%''' Recoil
| colspan="4" style="text-align:center" | -
|
|}
`;

const HATE = `

{| class="wikitable sortable stickyHeader"
|+
|-
! class=unsortable colspan="3" | Evolution
! class=unsortable | Notes
|-
! EVO1
| style="white-space: nowrap; text-align:center;" | Incarnon Form [[File:NeutralStanceAttacksFlingSpinningBlades(xWhite).png|64px|center]]
| 
*Reach '''6x''' Combo and then [[Melee#Heavy Attack|Heavy Attack]] to activate Incarnon Form.
*Forward and Neutral Combos embed explosive blades.
**'''+100%''' Melee Damage
**'''+20%''' Sprint Speed
**'''+20%''' to Parkour Velocity
|
*Forward and Neutral Combos in Incarnon Form will launch '''1''' spectral blade towards the crosshair that explode '''0.4''' seconds after impact, dealing {{D|Heat}} damage in a '''3''' meter radius.
**All hits are affected by the stance multiplier of the attack that launched the blade.
**Direct hits can headshot.
**Projectiles and explosions are silent.
**Explosions do not self stagger.
**Direct hits of spectral blades and explosions are affected by universal base damage sources like {{M|Vigorous Swap}}, {{M|Holster Amp}}, {{Arcane|Arcane Arachne}}, {{A|Vex Armor}} and {{A|Amp}}.
***Direct hit damage is affected by {{M|Condition Overload}}, but not the explosions.
**Damage is <u>'''not'''</u> affected by the damage increase on Evolution 2, Incarnon form's innate +100% melee damage, or melee damage bonuses like {{M|Pressure Point}}.
|-
! colspan="3" | Evolution Challenge 
!Complete a solo mission with this weapon equipped
|-
! rowspan="2" | EVO2
| style="white-space: nowrap; text-align:center;" | '''Swordsman's Flourish''' [[File:ComboGainInSwordAloneMode(xWhite).png|64px|center]]
|
*Increase Base Damage by '''+30'''.
*With Melee Weapon Equipped: '''+100%''' Combo Count Chance
|
*Combo Count Chance bonus requires manually equipping the melee, either by holding the weapon swap key (default {{Keybind|F}}) or going into a mission with only the melee weapon equipped.
*Combo Count Chance bonus does <u>not</u> affect quickswap melee attacks. 
|-
| style="white-space: nowrap; text-align:center;" | '''Stalker's Legacy''' [[File:ComboAndHeavyEfficiencyWithDreadAndDespairEquipped(xWhite).png|64px|center]]
|
*Increase Base Damage by '''+30'''.
*With {{Weapon|Dread}} and {{Weapon|Despair}} equipped: '''+30''' Initial Combo.
| style="text-align:center" | -
|-
! colspan="3" | Evolution Challenge 
!Activate this weapon's Incarnon form '''6''' times in a mission
|-
! rowspan="3" | |}
`;

const FURIS = `
{| class="wikitable sortable stickyHeader"
|+
|-
! class=unsortable colspan="3" | Evolution
! class=unsortable style="white-space: nowrap;" | {{Weapon|Furis}}
! class=unsortable style="white-space: nowrap;" | {{Weapon|Mk1-Furis}}
! class=unsortable | Notes
|-
! rowspan="2 | EVO2
| style="white-space: nowrap; text-align:center;" | '''Haven Foray''' [[File:DamageAndIncreasedDamageWithOvershields(xWhite).png|64px|center]]
|
* Increase Base Damage by '''+X'''.
* With Overshields: Increase Base Damage by '''+30'''.
| style="text-align:center" | X = 28
| style="text-align:center" | X = 34
| style="text-align:center" | -
|}
`;
