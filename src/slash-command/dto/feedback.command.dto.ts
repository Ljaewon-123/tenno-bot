import { Expose } from 'class-transformer';
import { StringOption } from 'necord';

export class FeedbackCommand {
  @Expose()
  @StringOption({
    name: 'message',
    description: 'Bug report, idea, or anything else',
    required: true,
    // 웹훅 content 한도가 2000자라 머리줄·이스케이프 몫을 남긴다
    max_length: 1000,
  })
  message: string;
}
