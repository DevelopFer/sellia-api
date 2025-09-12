import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}

// Export the schema for reuse
export { createUserSchema };