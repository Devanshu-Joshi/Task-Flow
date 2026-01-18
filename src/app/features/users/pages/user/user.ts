import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { UserTable } from '@features/users/components/user-table/user-table';

@Component({
  selector: 'app-user',
  imports: [UserTable],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {

  constructor(private http: HttpClient) { }

  btnClick() {
    const data = {
      email: 'test@example.com',
      password: 'password123A@'
    };

    this.http.post('http://localhost:5000/api/auth/login', data)
      .subscribe(response => {
        console.log(response);
      });
  }
}
