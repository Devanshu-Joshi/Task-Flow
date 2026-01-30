import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '@core/services/token-service/token-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const tokenService = inject(TokenService);
    const router = inject(Router);

    const token = tokenService.getToken();

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError(err => {
            if (err.status === 401) {
                tokenService.clearToken(true);
                router.navigate(['/login']);
                // OR redirect:
                // router.navigate(['/login']);
            }

            return throwError(() => err);
        })
    );
};