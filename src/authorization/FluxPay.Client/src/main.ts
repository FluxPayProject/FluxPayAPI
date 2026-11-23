import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule, primeNgOptions } from './app/app.module';
import { SERVER_URL } from './app/services/common/config.service';

interface FrontendConfig {
  baseUrl: unknown;
  primeUiLicense?: string;
}

function validateBaseUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('FluxPay API base URL is missing.');
  }

  const baseUrl = value.trim();
  const url = new URL(baseUrl, document.baseURI);
  const isAbsolute = /^https?:\/\//i.test(baseUrl);
  const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
  const isSameOriginPath = url.origin === window.location.origin && !url.pathname.startsWith('//');
  if (!isHttp || (!isAbsolute && !isSameOriginPath) || url.username || url.password || url.search || url.hash) {
    throw new Error('FluxPay API base URL is invalid.');
  }

  const requestBase = isAbsolute ? url.href : url.pathname;
  return requestBase.endsWith('/') ? requestBase : `${requestBase}/`;
}

async function bootstrap() {
  const response = await fetch('assets/config/config.json');
  if (!response.ok) throw new Error('Could not load FluxPay configuration.');

  const config: FrontendConfig = await response.json();
  const baseUrl = validateBaseUrl(config.baseUrl);
  primeNgOptions.license = config.primeUiLicense;
  await platformBrowserDynamic([{provide: SERVER_URL, useValue: baseUrl}]).bootstrapModule(AppModule);
}

void bootstrap().catch(error => console.error(error));
