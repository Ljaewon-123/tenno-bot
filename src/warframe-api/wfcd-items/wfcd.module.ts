import { Module } from '@nestjs/common';
import Items from '@wfcd/items';

@Module({})
export class WfcdModule {
  static forRoot() {
    return {
      module: WfcdModule,
      providers: [
        {
          provide: Items,
          useFactory: () => new Items({ category: ['All'] }),
        },
      ],
      exports: [Items],
    };
  }
}
