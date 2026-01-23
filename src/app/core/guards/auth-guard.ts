import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, filter, take } from 'rxjs/operators';
import { UserAuth } from '@core/services/user-auth/user-auth';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(UserAuth);
  const router = inject(Router);

  return auth.authReady$.pipe(
    filter(Boolean),
    take(1),
    map(() => {
      const isLoggedIn = auth.isAuthenticatedSync();

      if (route.data?.['guestOnly'] && isLoggedIn) {
        return router.createUrlTree(['/dashboard']);
      }

      if (route.data?.['requiresAuth'] && !isLoggedIn) {
        return router.createUrlTree(['/login']);
      }

      return true;
    })
  );
};