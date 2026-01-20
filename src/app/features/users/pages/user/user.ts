import { HttpClient } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { UserService } from '@core/services/user';
import { UserTable } from '@features/users/components/user-table/user-table';
import { UserModel } from '@core/models/User';

@Component({
  selector: 'app-user',
  imports: [UserTable],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User implements OnInit {

  users = signal<UserModel[]>([]);

  constructor(private http: HttpClient, private userService: UserService) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        console.log(this.users());
      },
      error: (err) => console.error(err)
    });
  }

}
