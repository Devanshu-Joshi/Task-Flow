import { Component, inject, OnInit, Signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { TaskService } from '../../../../core/services/task';
import { signal, computed } from '@angular/core';
import { Task } from '../../../../core/models/Task';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import dayjs from 'dayjs';
import { FormsModule } from '@angular/forms';
import { isEditing } from '../../../../core/services/task';

export type TaskStatus = 'Incomplete' | 'Completed' | 'InProgress';
@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CommonModule, NgxDaterangepickerMd, FormsModule],
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
  dateRange = signal<{ startDate: any; endDate: any } | null>(null);
  dropdownPosition = {
    top: 0,
    left: 0
  };
  selectedStatus = signal<string>(''); // '' means All
  tasks!: Signal<Task[]>;
  searchControl = new FormControl('');
  searchTerm = signal('');
  editingTaskId: string | null = null;

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

  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    const range = this.dateRange();

    return this.tasks().filter(task => {

      const matchesSearch =
        !term || task.title.toLowerCase().includes(term);

      const matchesStatus =
        !status || task.status === status;

      let matchesDate = true;

      if (range?.startDate && range?.endDate) {

        // 🔒 Normalize ALL dates to YYYY-MM-DD (no time, no TZ)
        const taskDate = dayjs(task.dueDate).format('YYYY-MM-DD');
        const startDate = dayjs(range.startDate).format('YYYY-MM-DD');
        const endDate = dayjs(range.endDate).format('YYYY-MM-DD');

        matchesDate =
          taskDate >= startDate &&
          taskDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  });

  clearDateRange() {
    this.dateRange.set(null);
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

    await this.taskService.addTask({
      ...formValue,
      id: this.editingTaskId!
    } as Task);

    this.taskForm.reset({
      title: '',
      dueDate: '',
      status: 'Incomplete'
    });

    this.editingTaskId = null;
    isEditing.set(false);
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

  edit(task: Task) {
    isEditing.set(true);
    this.editingTaskId = task.id!;
    this.taskForm.patchValue({
      title: task.title,
      dueDate: task.dueDate,
      status: task.status
    });
    this.toggleDialog();
  }

}