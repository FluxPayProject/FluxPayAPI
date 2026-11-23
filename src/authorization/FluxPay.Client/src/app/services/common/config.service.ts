import {Inject, Injectable, InjectionToken} from '@angular/core';

export const SERVER_URL = new InjectionToken<string>('FluxPay API base URL');

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  constructor(@Inject(SERVER_URL) private readonly serverUrl: string) {}

  public getServerUrl = () => this.serverUrl;
}
