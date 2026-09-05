import { Injectable } from '@nestjs/common';
import Items, { Locale } from '@wfcd/items';
import { DropItem } from './vo/drop-item.interface';
import { ItemI18n } from './vo/item-i18n.interface';

// 게임에서 빠진 열화판/구 입문 모드. name이 정식판과 완전히 같아서(Serration이 셋)
// 이름으로 찾으면 데이터 순서상 이쪽이 먼저 잡혀 +40% 카드가 나간다. uniqueName 경로로만 구분된다
const REMOVED_VARIANT = /\/(Beginner|Intermediate)\//;

@Injectable()
export class WfcdItemsService {
  private readonly CDN_BASE_URL = 'https://cdn.warframestat.us/img';

  constructor(private readonly wfcdItems: Items) {}

  /** uniqueName으로 원본(기본 언어) 아이템 데이터 조회 */
  private findItem(uniqueName: string) {
    return this.wfcdItems.find((item) => item.uniqueName === uniqueName);
  }

  /**
   * uniqueName + locale로 번역 데이터 조회.
   * i18n.json 실물 구조가 { [uniqueName]: { [locale]: ItemI18n } } 순서라 uniqueName으로 먼저 인덱싱해야 함
   * (라이브러리 d.ts 제네릭 표기가 실제 구조와 반대라 헷갈리기 쉬움 - 직접 데이터 까서 확인함).
   */
  findLocaleLang(uniqueName: string, locale: Locale): ItemI18n | undefined {
    const i18nBundle = this.wfcdItems.i18n as unknown as Record<
      string,
      Partial<Record<Locale, ItemI18n>>
    >;
    return i18nBundle?.[uniqueName]?.[locale];
  }

  /** imageName -> CDN URL. 아이템으로 잡히지 않는 고정 이미지(보스/샤드/NPC)도 같은 CDN을 탄다 */
  imgUrl(imageName: string): string {
    return `${this.CDN_BASE_URL}/${imageName}`;
  }

  /** uniqueName의 아이템 이미지 CDN URL 조회 (없으면 undefined) */
  findItemImg(uniqueName: string): string | undefined {
    const item = this.findItem(uniqueName);
    if (!item?.imageName) return undefined;
    return this.imgUrl(item.imageName);
  }

  /**
   * 드랍테이블 아이템 이름 -> 아이템. 드랍 이름은 wfcd 아이템명과 정확히 맞지 않는 게 많아
   * 뒷 단어를 하나씩 떼며 상위 아이템으로 폴백한다 ('Ash Prime Systems Blueprint' -> 'Ash Prime').
   * 부품 이미지는 죄다 GenericWarframePrimeSystem 같은 공용이라 상위 아이템 쪽이 더 쓸모 있다.
   * 성유물 보상 596개 중 592개가 이 방식으로 잡힌다.
   */
  findItemByName(itemName: string): DropItem | undefined {
    // '2X Forma Blueprint', '1200X Kuva' 같은 수량 접두어는 이름에 없다
    const words = itemName.replace(/^\d+X /, '').split(' ');
    while (words.length) {
      const name = words.join(' ');
      // 이미지 있는 쪽만 본다 — 'Forma Blueprint'처럼 이미지 없는 동명 항목이 상위 'Forma'를 가린다
      const item = this.wfcdItems.find(
        (candidate) =>
          candidate.name === name &&
          candidate.imageName &&
          !REMOVED_VARIANT.test(candidate.uniqueName),
      );
      if (item) return item;
      words.pop();
    }
    return;
  }

  /**
   * 바로 키티어 전용 프라임드 모드 전체. 드랍 테이블(all.json)에는 한 줄도 없어서
   * 드랍 인덱스를 만들 때 여기서 채워 넣는다. 두캇 값은 이 데이터에 없다 — 바로 재고에만 있다
   */
  findPrimedMods(): DropItem[] {
    return [...(this.wfcdItems as unknown as DropItem[])].filter((item) =>
      item.name?.startsWith('Primed '),
    );
  }

  /** @see findItemByName */
  findItemImgByName(itemName: string): string | undefined {
    const item = this.findItemByName(itemName);
    return item?.imageName ? this.imgUrl(item.imageName) : undefined;
  }

  /** locale이 주어지면 이름/설명 등을 번역본으로 덮어쓴 아이템 조회, 없으면 기본 언어 그대로 */
  findItemLocalized(uniqueName: string, locale?: Locale) {
    const item = this.findItem(uniqueName);
    if (!item) return;

    const translation = locale && this.findLocaleLang(uniqueName, locale);
    return translation ? { ...item, ...translation } : item;
  }
}
