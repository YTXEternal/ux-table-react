/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 环境变量
   *
   * @readonly
   * @type {('development' | 'production' | 'test')}
   */
  readonly VITE_APP_ENV: 'development' | 'production' | 'test';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
