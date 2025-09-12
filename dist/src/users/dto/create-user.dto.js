"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSchema = exports.CreateUserDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const zod_1 = require("zod");
const createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long'),
});
exports.createUserSchema = createUserSchema;
class CreateUserDto extends (0, nestjs_zod_1.createZodDto)(createUserSchema) {
}
exports.CreateUserDto = CreateUserDto;
//# sourceMappingURL=create-user.dto.js.map