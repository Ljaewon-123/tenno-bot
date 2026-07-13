import { Module } from '@nestjs/common';
import Items from '@wfcd/items';
import { Language } from './vo/enum';

@Module({})
export class WfcdModule {
  static forRoot() {
    return {
      module: WfcdModule,
      providers: [
        {
          provide: Items,
          useFactory: () =>
            new Items({ category: ['All'], i18n: Object.values(Language) }),
        },
      ],
      exports: [Items],
    };
  }
}
