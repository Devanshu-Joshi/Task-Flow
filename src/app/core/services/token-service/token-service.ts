import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TokenService {

  private tokenClearedSubject = new Subject<void>();
  tokenCleared$ = this.tokenClearedSubject.asObservable();

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    localStorage.removeItem('token');
    this.tokenClearedSubject.next();
  }
}