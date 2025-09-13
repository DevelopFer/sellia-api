import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  messageType: z.string().default('text'),
  senderId: z.string(),
  conversationId: z.string(),
});

export class CreateMessageDto extends createZodDto(createMessageSchema) {}

export { createMessageSchema };