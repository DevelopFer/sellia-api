import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const findOrCreateConversationSchema = z.object({
  currentUserId: z.string(),
  otherUserId: z.string(),
});

export class FindOrCreateConversationDto extends createZodDto(findOrCreateConversationSchema) {}

export { findOrCreateConversationSchema };