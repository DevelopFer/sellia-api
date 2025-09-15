import { Module, Global } from '@nestjs/common';
import { UserEventsService } from './user-events.service';

@Global()
@Module({
  providers: [UserEventsService],
  exports: [UserEventsService],
})
export class EventsModule {}