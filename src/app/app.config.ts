import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { APP_BASE_HREF } from '@angular/common';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Keep the repository path in <base href> for assets, but route within the URL fragment.
    { provide: APP_BASE_HREF, useValue: '' },
    provideRouter(routes, withHashLocation())
  ]
};
