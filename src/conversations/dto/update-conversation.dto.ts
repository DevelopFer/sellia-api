import { createZodDto } from 'nestjs-zod';
import { createConversationSchema } from './create-conversation.dto';

// Create a partial schema where all fields are optional
const updateConversationSchema = createConversationSchema.partial();

export class UpdateConversationDto extends createZodDto(updateConversationSchema) {}

// Export the schema for reuse
export { updateConversationSchema };