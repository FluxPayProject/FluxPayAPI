import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule, primeNgOptions } from './app/app.module';

interface FrontendConfig {
  baseUrl: string;
  primeUiLicense?: string;
}

async function bootstrap() {
  const response = await fetch('assets/config/config.json');
  if (!response.ok) throw new Error('Could not load FluxPay configuration.');

  const config: FrontendConfig = await response.json();
  localStorage.setItem('serverUrl', config.baseUrl);
  primeNgOptions.license = config.primeUiLicense;
  await platformBrowserDynamic().bootstrapModule(AppModule);
}

void bootstrap().catch(error => console.error(error));
