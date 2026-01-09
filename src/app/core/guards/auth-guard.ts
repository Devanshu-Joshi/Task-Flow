import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.authReady$.pipe(
    filter(ready => ready),     // ⏳ wait for Firebase
    take(1),
    map(() => {
      const isLoggedIn = auth.isAuthenticatedSync();

      if (route.data?.['guestOnly'] && isLoggedIn) {
        router.navigate(['/dashboard']);
        return false;
      }

      if (route.data?.['requiresAuth'] && !isLoggedIn) {
        router.navigate(['/login']);
        return false;
      }

      return true;
    })
  );
};