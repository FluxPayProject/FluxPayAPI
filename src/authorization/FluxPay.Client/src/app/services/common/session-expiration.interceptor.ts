import {Injectable, Injector} from '@angular/core';
import {HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import {ProfileStateService} from '../state/profile-state.service';

@Injectable()
export class SessionExpirationInterceptor implements HttpInterceptor {
  private checkingSession = false;

  constructor(private readonly injector: Injector) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    return next.handle(request).pipe(catchError((error: unknown) => {
      const baseUrl = localStorage.getItem('serverUrl');
      if (error instanceof HttpErrorResponse && error.status === 401 && baseUrl &&
          request.url.startsWith(baseUrl) && /^(consumer|sender)\//.test(request.url.slice(baseUrl.length))) {
        void this.checkSession();
      }
      return throwError(() => error);
    }));
  }

  private async checkSession() {
    if (this.checkingSession) return;
    this.checkingSession = true;

    try {
      const profileState = this.injector.get(ProfileStateService);
      if (!profileState.isAuthenticated) return;

      const session = await profileState.getAuthenticationAsync();
      if (!session.authenticated) window.location.reload();
    } catch {
      // The original API error is still handled by its caller.
    } finally {
      this.checkingSession = false;
    }
  }
}
