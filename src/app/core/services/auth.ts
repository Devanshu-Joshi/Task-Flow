import { Injectable, signal } from '@angular/core';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, Auth, User } from "@angular/fire/auth";
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  user = signal<User | null>(null);
  isLoggedIn = signal<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private authReadySubject = new BehaviorSubject<boolean>(false);
  authReady$ = this.authReadySubject.asObservable();

  constructor(private auth: Auth, private router: Router) {
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
      this.authReadySubject.next(true);
      this.user.set(user);
      this.isLoggedIn.set(!!user);
    });
  }

  get currentUser() {
    return this.userSubject.value;
  }

  isAuthenticatedSync(): boolean {
    return !!this.userSubject.value;
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.user.set(userCredential.user);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async register(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      this.user.set(userCredential.user);
      return userCredential;
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.user.set(null);
      this.isLoggedIn.set(false);
      this.router.navigate(['/login']);
    } catch (error) {
      throw error;
    }
  }
}
