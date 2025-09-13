import { Module } from '@nestjs/common';
import { UsernameController } from './username.controller';
import { UsernameService } from './username.service';

@Module({
  controllers: [UsernameController],
  providers: [UsernameService]
})
export class UsernameModule {}
