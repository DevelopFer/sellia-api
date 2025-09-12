import { createZodDto } from 'nestjs-zod';
import { createUserSchema } from './create-user.dto';

// Create a partial schema where all fields are optional
const updateUserSchema = createUserSchema.partial();

export class UpdateUserDto extends createZodDto(updateUserSchema) {}

// Export the schema for reuse
export { updateUserSchema };