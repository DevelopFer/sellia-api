declare const updateUserSchema: import("zod").ZodObject<{
    email: import("zod").ZodOptional<import("zod").ZodString>;
    name: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>;
declare const UpdateUserDto_base: import("nestjs-zod").ZodDto<import("zod").ZodObject<{
    email: import("zod").ZodOptional<import("zod").ZodString>;
    name: import("zod").ZodOptional<import("zod").ZodString>;
}, import("zod/v4/core").$strip>> & {
    io: "input";
};
export declare class UpdateUserDto extends UpdateUserDto_base {
}
export { updateUserSchema };
