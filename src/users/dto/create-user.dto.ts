import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createUserSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
  name: z.string().optional(),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}

// Export the schema for reuse
export { createUserSchema };