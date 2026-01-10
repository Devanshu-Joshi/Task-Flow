import { Component, inject, OnInit, Signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { TaskService } from '../../../../core/services/task';
import { signal, computed } from '@angular/core';
import { Task } from '../../../../core/models/Task';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';

export type TaskStatus = 'Incomplete' | 'Completed' | 'InProgress';
@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  isDialogClosed: boolean = true;
  toggleDialog() {
    this.isDialogClosed = !this.isDialogClosed;
  }

  fb = inject(FormBuilder);
  showStatusDropdown = false;
  dropdownPosition = {
    top: 0,
    left: 0
  };
  selectedStatus = signal<string>(''); // '' means All
  tasks!: Signal<Task[]>;
  searchControl = new FormControl('');
  searchTerm = signal('');
  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();

    return this.tasks().filter(task => {
      const matchesSearch = !term
        || task.title.toLowerCase().includes(term);

      const matchesStatus = !status
        || task.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  constructor(public taskService: TaskService,) {
    this.tasks = this.taskService.tasks;
  }

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.searchTerm.set(value || '');
      });
  }

  totalTasks = computed(() => this.tasks().length);

  completedTasks = computed(
    () => this.tasks().filter(task => task.status === 'Completed').length
  );

  inProgressTasks = computed(
    () => this.tasks().filter(t => t.status === 'InProgress').length
  );

  incompleteTasks = computed(
    () => this.tasks().filter(t => t.status === 'Incomplete').length
  );

  taskForm = this.fb.nonNullable.group({
    title: ['', [
      Validators.required,
      Validators.minLength(3)
    ]],
    dueDate: ['', Validators.required],
    status: ['Incomplete' as TaskStatus, Validators.required]
  });

  toggleStatusDropdown() {
    this.showStatusDropdown = !this.showStatusDropdown;
  }

  openStatusDropdown(event: MouseEvent) {
    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;

    const rect = button.getBoundingClientRect();

    this.dropdownPosition = {
      top: rect.bottom + 6,
      left: rect.left
    };

    this.showStatusDropdown = true;
  }

  selectStatus(status: string) {
    this.selectedStatus.set(status);
    this.showStatusDropdown = false;
  }

  async submit() {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formValue = this.taskForm.getRawValue();

    console.log('Add Task form data:', formValue);

    await this.taskService.addTask(formValue);

    this.taskForm.reset({
      title: '',
      dueDate: '',
      status: 'Incomplete'
    });

    this.toggleDialog();
  }

  async delete(taskId: string) {

    if (!taskId) return;

    try {
      console.log('Deleting task with ID:', taskId);
      await this.taskService.deleteTask(taskId);
      this.toggleDialog();
    } catch (error) {
      console.error('Error deleting task:', error);
    }

  }

}