import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserModel } from '@core/models/UserModel';
import { TokenService } from '@core/services/token-service/token-service';
import { PermissionKey } from '@core/models/PermissionKey';

interface LoginResponse {
  token: string;
  user?: any;
}

interface RegisterResponse {
  token: string;
  user?: any;
}

@Injectable({ providedIn: 'root' })
export class UserAuth {

  private apiUrl = 'http://localhost:3080/api/auth';

  user = signal<UserModel | null>(null);
  isLoggedIn = signal<boolean>(false);

  private authReadySubject = new BehaviorSubject<boolean>(false);
  authReady$ = this.authReadySubject.asObservable();
  private currentUserSubject = new BehaviorSubject<UserModel | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private toastr: ToastrService, private tokenService: TokenService) {
    this.initAuth();

    this.tokenService.tokenCleared$.subscribe(() => {
      this.handleForcedLogout();
    });
  }

  private initAuth() {
    const token = this.tokenService.getToken();

    if (token && !this.isTokenExpired(token)) {

      this.getMe()
        .pipe(finalize(() => this.authReadySubject.next(true)))
        .subscribe(user => {
          this.user.set(user);
          this.setCurrentUser(user);
          this.isLoggedIn.set(true);
        });

    } else {
      this.clearAuth();
      this.authReadySubject.next(true);
    }
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.isLoggedIn.set(true);

        this.getMe().subscribe(user => {
          this.user.set(user);
          this.setCurrentUser(user);
        });
      })
    );
  }

  register(payload: { name: string, email: string; password: string, parentId: number }) {
    return this.http
      .post<string>(`${this.apiUrl}/signup`, payload, { responseType: 'text' as 'json' });
  }

  getMe() {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }

  refreshCurrentUser() {
    return this.getMe()
      .pipe(
        finalize(() => this.authReadySubject.next(true))
      )
      .subscribe(user => {
        this.user.set(user);
        this.setCurrentUser(user);
        this.isLoggedIn.set(true);
      });
  }

  logout() {
    this.clearAuth();
    this.user.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
    this.toastr.success('Logout successful', 'Success');
  }

  private handleForcedLogout() {
    this.setCurrentUser(null as any);
    this.user.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
    this.toastr.warning('Session expired. Please login again.', 'Unauthorized');
  }

  private clearAuth() {
    this.setCurrentUser(null as any);
    localStorage.removeItem('token');
    this.user.set(null);
    this.isLoggedIn.set(false);
  }

  isAuthenticatedSync(): boolean {
    const token = this.tokenService.getToken();
    return !!token && !this.isTokenExpired(token);
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

  hasPermission(permission: PermissionKey): boolean {
    return this.currentUserSubject.value?.permissions?.includes(permission) ?? false;
  }

  get currentUser(): UserModel | null {
    return this.currentUserSubject.value;
  }

  setCurrentUser(user: UserModel): void {
    this.currentUserSubject.next(user);
  }
}