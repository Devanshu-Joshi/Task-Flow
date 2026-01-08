import { Routes } from '@angular/router';
import { Login } from './features/auth/pages/login/login';
import { Signup } from './features/auth/pages/signup/signup';

export const routes: Routes = [
    { path: 'login', component: Login },
    { path: 'signup', component: Signup },
];
