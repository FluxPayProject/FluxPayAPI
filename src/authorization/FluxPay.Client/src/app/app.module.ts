import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './pages/layout/layout.component';
import { HeaderComponent } from './components/header/header.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MainComponent } from './components/main/main.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { APP_BASE_HREF } from '@angular/common';
import {FormsModule} from "@angular/forms";
import { LoginWindowComponent } from './components/login-window/login-window.component';
import { SkeletonModule } from 'primeng/skeleton';
import {provideEnvironmentNgxMask} from "ngx-mask";
import {ToastModule} from "primeng/toast";
import {MessageService} from "primeng/api";
import { PrimeNGConfigType, providePrimeNG } from "primeng/config";
import Lara from "@primeuix/themes/lara";
import { AutoCompleteModule } from 'primeng/autocomplete';

import { SessionExpirationInterceptor } from './services/common/session-expiration.interceptor';

export const primeNgOptions: PrimeNGConfigType = {
  theme: { preset: Lara, options: { darkModeSelector: false } }
};

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    HeaderComponent,
    MainComponent,
    NavbarComponent,
    LoginWindowComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    AngularSvgIconModule.forRoot(),
    FormsModule,
    SkeletonModule,
    ToastModule,
    AutoCompleteModule
  ],
  providers: [
    {
      provide: APP_BASE_HREF,
      useValue: "/app"
    },
    { provide: HTTP_INTERCEPTORS, useClass: SessionExpirationInterceptor, multi: true },
    provideEnvironmentNgxMask(),
    providePrimeNG(primeNgOptions),
    MessageService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
