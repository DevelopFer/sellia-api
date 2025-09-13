import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(2, 'At least two participants required'),
  title: z.string().optional(),
  isGroup: z.boolean().default(false),
});

export class CreateConversationDto extends createZodDto(createConversationSchema) {}


export { createConversationSchema };