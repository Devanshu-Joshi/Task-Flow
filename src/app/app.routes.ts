import { Routes } from '@angular/router';
import { Login } from '@features/auth/pages/login/login';
import { Signup } from '@features/auth/pages/signup/signup';
import { Dashboard } from '@features/dashboard/pages/dashboard/dashboard';
import { authGuard } from '@core/guards/auth-guard';
import { User } from '@features/users/pages/user/user';

export const routes: Routes = [
    {
        path: 'login',
        component: Login,
        canActivate: [authGuard],
        data: { guestOnly: true }
    },
    {
        path: 'signup',
        component: Signup,
        canActivate: [authGuard],
        data: { guestOnly: true }
    },
    {
        path: 'tasks',
        component: Dashboard,
        canActivate: [authGuard],
        data: { requiresAuth: true }
    },
    {
        path: 'users',
        component: User,
        canActivate: [authGuard],
        data: { requiresAuth: true }
    },
    { path: '**', redirectTo: '' }
];
