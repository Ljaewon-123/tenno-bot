import { Injectable } from '@nestjs/common';
import Items, { Locale } from '@wfcd/items';
import { ItemI18n } from './vo/item-i18n.interface';

@Injectable()
export class WfcdItemsService {
  constructor(private readonly wfcdItems: Items) {}

  findLocaleLang(locale: Locale): ItemI18n {
    return this.wfcdItems.i18n[locale] as ItemI18n;
  }
}
