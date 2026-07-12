import { Injectable } from '@nestjs/common';
import { Context, type ContextOf, On, Once } from 'necord';

@Injectable()
export class BotLifecycleHook {
  onApplicationBootstrap() {
    console.log('BotLifecycleHook: Application has bootstrapped.');
  }

  @Once('ready')
  onReady(@Context() [client]: ContextOf<'ready'>) {
    console.log(`Logged in as ${client.user.username}!`);
  }

  @On('warn')
  onWarn(@Context() [message]: ContextOf<'warn'>) {
    console.log(message);
  }
}
