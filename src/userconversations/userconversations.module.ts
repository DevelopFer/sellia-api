import { Module } from '@nestjs/common';
import { UserconversationsService } from './userconversations.service';

@Module({
  providers: [UserconversationsService]
})
export class UserconversationsModule {}
