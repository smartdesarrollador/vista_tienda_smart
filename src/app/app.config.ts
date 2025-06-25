import {
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import {
  HttpClientModule,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import {
  BrowserAnimationsModule,
  provideAnimations,
} from '@angular/platform-browser/animations';
import { tokenInterceptor } from './core/auth/interceptors/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(
      HttpClientModule,
      BrowserModule,
      BrowserAnimationsModule
    ),
    provideHttpClient(withFetch(), withInterceptors([tokenInterceptor])),
    provideAnimations(),
  ],
};
