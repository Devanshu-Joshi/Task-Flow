import { Injectable, signal } from '@angular/core';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, Auth, User } from "@angular/fire/auth";

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  user = signal<User | null>(null);
  isLoggedIn = signal<boolean>(false);

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, (user) => {
      this.user.set(user);
      this.isLoggedIn.set(!!user);
    });
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
    } catch (error) {
      throw error;
    }
  }
}
