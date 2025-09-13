import { createZodDto } from 'nestjs-zod';
import { createMessageSchema } from './create-message.dto';

const updateMessageSchema = createMessageSchema.partial();

export class UpdateMessageDto extends createZodDto(updateMessageSchema) {}

export { updateMessageSchema };