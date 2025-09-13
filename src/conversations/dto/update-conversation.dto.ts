import { createZodDto } from 'nestjs-zod';
import { createConversationSchema } from './create-conversation.dto';

const updateConversationSchema = createConversationSchema.partial();

export class UpdateConversationDto extends createZodDto(updateConversationSchema) {}

export { updateConversationSchema };