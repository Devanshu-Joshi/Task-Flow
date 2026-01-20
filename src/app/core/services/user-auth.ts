import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

interface LoginResponse {
  token: string;
  user?: any; // optional user payload
}

interface RegisterResponse {
  token: string;
  user?: any;
}

@Injectable({ providedIn: 'root' })
export class UserAuth {

  private apiUrl = 'http://localhost:3080/api/auth';

  // Signals (for components)
  user = signal<any | null>(null);
  isLoggedIn = signal<boolean>(false);

  // RxJS (for guards/interceptors)
  private authReadySubject = new BehaviorSubject<boolean>(false);
  authReady$ = this.authReadySubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private toastr: ToastrService) {
    this.initAuth();
  }

  // 🔹 Runs once on app startup
  private initAuth() {
    const token = this.getToken();

    if (token && !this.isTokenExpired(token)) {
      this.isLoggedIn.set(true);
      this.user.set(this.decodeToken(token));
    } else {
      this.clearAuth();
    }

    this.authReadySubject.next(true);
  }

  // 🔹 Login
  login(credentials: { email: string; password: string }) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.isLoggedIn.set(true);
        this.user.set(this.decodeToken(res.token));
      })
    );
  }

  // 🔹 Register
  register(payload: { email: string; password: string, parent_id: number }) {
    return this.http
      .post<string>(`${this.apiUrl}/signup`, payload, { responseType: 'text' as 'json' });
  }


  // 🔹 Logout
  logout() {
    this.clearAuth();
    this.user.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
    this.toastr.success('Logout successful', 'Success');
  }

  private clearAuth() {
    localStorage.removeItem('token');
    this.user.set(null);
    this.isLoggedIn.set(false);
  }

  isAuthenticatedSync(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private decodeToken(token: string): any | null {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return true;
    return payload.exp * 1000 < Date.now();
  }
}