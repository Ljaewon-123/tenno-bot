import { mixin, Type } from '@nestjs/common';
import { DataSource, ObjectLiteral, Repository } from 'typeorm';

type ClassType<T = any> = new (...args: any[]) => T;

export const Mixin = <T extends ObjectLiteral>(
  cls: ClassType<T>,
): Type<Repository<T>> => {
  class Cls extends Repository<T> {
    constructor(protected readonly dataSource: DataSource) {
      super(cls, dataSource.createEntityManager());
    }
  }

  return mixin(Cls);
};
