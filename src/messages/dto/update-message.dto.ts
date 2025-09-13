import { createZodDto } from 'nestjs-zod';
import { createMessageSchema } from './create-message.dto';

// Create a partial schema where all fields are optional
const updateMessageSchema = createMessageSchema.partial();

export class UpdateMessageDto extends createZodDto(updateMessageSchema) {}

// Export the schema for reuse
export { updateMessageSchema };