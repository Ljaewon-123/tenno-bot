import { createCommandGroupDecorator } from 'necord';

export const AlarmCommands = createCommandGroupDecorator({
  name: 'alarm',
  description: 'Manage repeating Warframe info alarms',
});
