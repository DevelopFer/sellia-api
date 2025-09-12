"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const unplugin_swc_1 = __importDefault(require("unplugin-swc"));
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        root: './',
        environment: 'node',
        setupFiles: ['./test/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    },
    plugins: [
        unplugin_swc_1.default.vite({
            module: { type: 'es6' },
        }),
    ],
});
//# sourceMappingURL=vitest.config.js.map