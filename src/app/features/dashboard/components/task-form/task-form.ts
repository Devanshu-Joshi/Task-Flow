import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { UserService } from '@core/services/user/user.service';
import { UserModel } from '@core/models/UserModel';
import { Observable } from 'rxjs';

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
  @Input() users$!: Observable<UserModel[]>;

  @Output() submitForm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor() { }
}
