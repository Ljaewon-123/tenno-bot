import { Injectable } from '@nestjs/common';
import Items from '@wfcd/items';
import { CDN_BASE_URL, REMOVED_VARIANT } from './constants.js';
import { DropItem } from './vo/drop-item.interface.js';

@Injectable()
export class WfcdItemsService {
  /** 이름 → 이미지 있는 아이템. /incarnon 자동완성처럼 키 입력마다 불려서 전체 스캔을 부팅 1회로 줄인다 */
  private readonly byName = new Map<string, DropItem>();
  /** 부품 이름 → 상위 아이템 */
  private readonly byComponent = new Map<string, DropItem>();
  private readonly incarnonGenesis: DropItem[] = [];

  constructor(private readonly wfcdItems: Items) {
    // Items는 Array 서브클래스라 filter/map이 Items 생성자를 다시 부른다 — for...of로만 훑는다
    for (const item of wfcdItems as unknown as DropItem[]) {
      if (item.name?.endsWith(' Incarnon Genesis'))
        this.incarnonGenesis.push(item);
      // 이미지 없는 동명 항목('Forma Blueprint')이 상위 'Forma'를 가리지 않게 이미지 있는 쪽만 담는다
      if (!item.imageName) continue;
      if (!this.byName.has(item.name) && !REMOVED_VARIANT.test(item.uniqueName))
        this.byName.set(item.name, item);
      for (const component of item.components ?? [])
        if (!this.byComponent.has(component.name))
          this.byComponent.set(component.name, item);
    }
  }

  findItem(uniqueName: string) {
    return this.wfcdItems.find((item) => item.uniqueName === uniqueName);
  }

  imgUrl(imageName: string): string {
    return `${CDN_BASE_URL}/${imageName}`;
  }

  findItemImg(uniqueName: string): string | undefined {
    const item = this.findItem(uniqueName);
    if (!item?.imageName) return undefined;
    return this.imgUrl(item.imageName);
  }

  /** 드랍 이름이 wfcd 이름과 안 맞는 게 많아 뒷 단어를 떼며 상위 아이템으로 폴백한다('Ash Prime Systems Blueprint' → 'Ash Prime') */
  findItemByName(itemName: string): DropItem | undefined {
    // '2X Forma Blueprint', '1200X Kuva' 같은 수량 접두어는 이름에 없다
    const words = itemName.replace(/^\d+X /, '').split(' ');
    while (words.length) {
      const item = this.byName.get(words.join(' '));
      if (item) return item;
      words.pop();
    }

    // 'Kavasa Prime Band'처럼 상위 이름이 접두사가 아니면 components에서 거꾸로 찾는다
    return this.byComponent.get(itemName);
  }

  /** 드랍 인덱스는 'Axi A1 Relic', wfcd는 'Axi A1 Intact'. 볼팅 여부는 여기에만 있다 */
  findRelic(relicName: string): DropItem | undefined {
    const base = relicName.replace(/ Relic$/, '');
    // d.ts의 components는 미해석 ComponentRef까지 포함하지만 로드된 데이터는 전부 name이 채워져 있다
    return this.wfcdItems.find(
      (candidate) => candidate.name === `${base} Intact`,
    ) as DropItem | undefined;
  }

  /** 프라임드 모드는 드랍 테이블에 없어 인덱스 구축 때 여기서 채운다 */
  findPrimedMods(): DropItem[] {
    return [...(this.wfcdItems as unknown as DropItem[])].filter((item) =>
      item.name?.startsWith('Primed '),
    );
  }

  /** 이름이 위키 페이지명과 그대로 일치해 위키 검색 없이 쓴다 */
  findIncarnonGenesis(): DropItem[] {
    return this.incarnonGenesis;
  }

  findItemImgByName(itemName: string): string | undefined {
    const item = this.findItemByName(itemName);
    return item?.imageName ? this.imgUrl(item.imageName) : undefined;
  }
}
