import { Injectable } from '@nestjs/common';
import Items, { Locale } from '@wfcd/items';
import { ItemI18n } from './vo/item-i18n.interface';

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

  /** uniqueName의 아이템 이미지 CDN URL 조회 (없으면 undefined) */
  findItemImg(uniqueName: string): string | undefined {
    const item = this.findItem(uniqueName);
    if (!item?.imageName) return undefined;
    return `${this.CDN_BASE_URL}/${item.imageName}`;
  }

  /** locale이 주어지면 이름/설명 등을 번역본으로 덮어쓴 아이템 조회, 없으면 기본 언어 그대로 */
  findItemLocalized(uniqueName: string, locale?: Locale) {
    const item = this.findItem(uniqueName);
    if (!item) return undefined;

    const translation = locale && this.findLocaleLang(uniqueName, locale);
    return translation ? { ...item, ...translation } : item;
  }
}
