import { z } from 'zod';
declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>;
declare const CreateUserDto_base: import("nestjs-zod").ZodDto<z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
}, z.core.$strip>> & {
    io: "input";
};
export declare class CreateUserDto extends CreateUserDto_base {
}
export { createUserSchema };
