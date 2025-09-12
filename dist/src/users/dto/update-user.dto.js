"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.UpdateUserDto = void 0;
const nestjs_zod_1 = require("nestjs-zod");
const create_user_dto_1 = require("./create-user.dto");
const updateUserSchema = create_user_dto_1.createUserSchema.partial();
exports.updateUserSchema = updateUserSchema;
class UpdateUserDto extends (0, nestjs_zod_1.createZodDto)(updateUserSchema) {
}
exports.UpdateUserDto = UpdateUserDto;
//# sourceMappingURL=update-user.dto.js.map