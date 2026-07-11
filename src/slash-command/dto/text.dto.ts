import { StringOption } from 'necord';

export class TextDto {
  @StringOption({
    name: 'text',
    description: 'The text to echo back',
    required: true,
  })
  text: string;
}
