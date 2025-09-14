import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { SocketModule } from '../socket/socket.module';
import { UserconversationsService } from 'src/userconversations/userconversations.service';
import { ChatbotService } from 'src/openAI/chatbot';

@Module({
  imports: [SocketModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    UserconversationsService,
    ChatbotService
  ],
  exports: [MessagesService],
})
export class MessagesModule {}