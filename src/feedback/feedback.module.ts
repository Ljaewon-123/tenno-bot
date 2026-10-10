import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service.js';

@Module({
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
