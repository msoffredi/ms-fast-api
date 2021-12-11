// eslint-disable-next-line no-undef
module.exports = {
    preset: 'ts-jest',
    modulePathIgnorePatterns: ['<rootDir>/__tests__/utils'],
    clearMocks: true,
    globalSetup: './node_modules/@shelf/jest-dynamodb/setup.js',
    globalTeardown: './node_modules/@shelf/jest-dynamodb/teardown.js',
    testEnvironment: './node_modules/@shelf/jest-dynamodb/environment.js',
    setupFilesAfterEnv: ['./__tests__/utils/setup.ts'],
    collectCoverageFrom: ['src/**/*.{ts,js}'],
};
