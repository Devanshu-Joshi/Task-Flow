import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { UserService } from '@core/services/user';
import { UserModel } from '@core/models/User';

@Component({
  selector: 'app-task-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm {
  @Input({ required: true }) form!: FormGroup;

  @Input() dialogTitle: string = 'Add';
  @Input() dialogDescription: string = 'Add task details below';
  @Input() dialogTitleColor: 'text-primary' | 'text-warn' | 'text-danger' = 'text-primary';
  @Input() dialogSubmitText: string = 'Save';
  @Input() isDeleting: boolean = false;

  @Output() submitForm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  users = signal<UserModel[]>([]);

  constructor(private userService: UserService) { }

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
