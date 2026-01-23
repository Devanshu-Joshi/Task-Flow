import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, defer, Observable, shareReplay, take, tap } from 'rxjs';
import { environment } from "@environments/environment";
import { UserModel } from '@core/models/UserModel';
import { PermissionKey } from '@core/models/PermissionKey';
import { UserAuth } from '@core/services/user-auth/user-auth';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly apiUrl = environment.API_URL + "/users";

  constructor(private http: HttpClient, private userAuth: UserAuth) { }

  private usersSubject = new BehaviorSubject<UserModel[]>([]);
  users$ = this.usersSubject.asObservable();

  private loaded = false;

  getUsersByParent(force = false): Observable<UserModel[]> {
    if (!this.loaded || force) {
      this.loaded = true;
      this.userAuth.refreshCurrentUser();

      this.http
        .get<UserModel[]>(`${this.apiUrl}/by-parent`)
        .pipe(take(1))
        .subscribe(users => this.usersSubject.next(users));
    }

    return this.users$;
  }

  addUser(user: Partial<UserModel>): Observable<UserModel> {
    if (!this.loaded) {
      this.getUsersByParent();
    }

    return this.http.post<UserModel>(this.apiUrl, user).pipe(
      take(1),
      tap(createdUser => {
        const current = this.usersSubject.value;
        this.usersSubject.next([...current, createdUser]);
      })
    );
  }

  updateUser(user: Partial<UserModel>): Observable<UserModel> {
    if (!this.loaded) {
      this.getUsersByParent();
    }

    return this.http.put<UserModel>(`${this.apiUrl}/${user.id}`, user).pipe(
      take(1),
      tap(updatedUser => {
        const current = this.usersSubject.value;

        const updatedList = current.map(u =>
          u.id === updatedUser.id ? updatedUser : u
        );

        this.usersSubject.next(updatedList);
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    if (!this.loaded) {
      this.getUsersByParent();
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      take(1),
      tap(() => {
        const current = this.usersSubject.value;
        this.usersSubject.next(current.filter(u => u.id !== id));
      })
    );
  }

}