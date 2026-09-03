import { describe, expect, it } from 'vitest';
import { WfcdItemsService } from './wfcd-items.service';

/** 드랍 이름 → 이미지 폴백. 이게 깨지면 /drop 임베드에서 썸네일이 통째로 사라진다 */
describe('WfcdItemsService.findItemImgByName', () => {
  const service = new WfcdItemsService([
    { name: 'Ash Prime', imageName: 'AshPrime.png' },
    { name: 'Forma', imageName: 'Forma.png' },
    { name: 'Vitality', imageName: 'HealthMaxMod.jpg' },
  ] as never);

  it('이름이 정확히 맞으면 그대로 찾는다', () => {
    expect(service.findItemImgByName('Vitality')).toContain('HealthMaxMod.jpg');
  });

  it('부품 이름은 뒷 단어를 떼고 상위 아이템으로 폴백한다', () => {
    expect(service.findItemImgByName('Ash Prime Systems Blueprint')).toContain(
      'AshPrime.png',
    );
  });

  it('수량 접두어를 무시한다', () => {
    expect(service.findItemImgByName('2X Forma Blueprint')).toContain(
      'Forma.png',
    );
  });

  it('못 찾으면 undefined', () => {
    expect(service.findItemImgByName('Kavasa Prime Buckle')).toBeUndefined();
  });
});
