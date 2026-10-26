// Fuso fixo para os testes.
//
// Sem isto, o fuso é o da máquina e um teste de data passa ou falha conforme
// quem roda. Em UTC, código que confunde hora local com UTC parece correto —
// os dois coincidem. A conversão das datas do cupom foi reescrita com erro de
// fuso de propósito, num teste de mutação, e a suíte não acusou nada rodando
// em UTC; com este fuso, acusa.
//
// Vai aqui porque o `jest.config.js` é avaliado antes de os workers subirem, e
// eles herdam o ambiente. Em `setup-jest.ts` seria tarde: o V8 já teria
// resolvido o fuso.
process.env.TZ = 'America/Sao_Paulo';

module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.(html|svg)$'
    }
  },
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': 'jest-preset-angular'
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment'
  ],
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/app/core/$1',
    '@shared/(.*)': '<rootDir>/src/app/shared/$1',
    '@features/(.*)': '<rootDir>/src/app/features/$1',
    '@environments/(.*)': '<rootDir>/src/environments/$1',
    '@assets/(.*)': '<rootDir>/src/assets/$1'
  }
};
