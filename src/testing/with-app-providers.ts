import { appConfig } from '../app/app.config';

export const APP_TEST_PROVIDERS = [...(appConfig.providers ?? [])];