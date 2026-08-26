import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getVersion() {
    return { message: 'success' };
  }
}
