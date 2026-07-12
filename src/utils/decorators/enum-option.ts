import { StringOption } from 'necord';
import { EnumOptionParams } from './types';

export const EnumOption = <T extends Record<string, string>>({
  enum: enumObj,
  ...rest
}: EnumOptionParams<T>): PropertyDecorator =>
  StringOption({
    ...rest,
    choices: Object.values(enumObj).map((value) => ({ name: value, value })),
  });
