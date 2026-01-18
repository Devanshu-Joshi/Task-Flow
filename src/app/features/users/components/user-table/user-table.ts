import { Component, computed, inject, model, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import { TaskView } from '@core/models/Task';
import dayjs from 'dayjs';
import { TaskStatus } from '@features/dashboard/pages/dashboard/dashboard';

@Component({
  selector: 'app-user-table',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, NgxDaterangepickerMd],
  templateUrl: './user-table.html',
  styleUrl: './user-table.css',
})
export class UserTable {

  // All Variables
  fb = inject(FormBuilder);
  searchControl: FormControl = new FormControl('');
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Completed', value: 'Completed' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Incomplete', value: 'Incomplete' }
  ];
  selectedStatus = signal<string | null>(null);
  dateRange = signal<{ startDate: any; endDate: any } | null>(null);
  selectedPageSize = model<number | 'All'>(5);
  itemsPerPage = 5;
  totalItems = computed(() => this.filteredTasks().length);
  p: number = 1;
  isTasksDropdownOpen = false;
  searchTerm = signal('');
  sortField = signal<'title' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  tasks!: Signal<TaskView[]>;
  pageSizeOptions = [5, 10, 20, 'All'] as const;
  taskForm = this.fb.nonNullable.group({
    title: ['', [
      Validators.required,
      Validators.minLength(3)
    ]],
    dueDate: ['', Validators.required],
    status: ['Incomplete' as TaskStatus, Validators.required]
  });

  toggleDatePicker() {
    const picker = document.querySelector(
      '.md-drppicker'
    ) as HTMLElement;
    if (picker.classList.contains("shown")) {
      picker.classList.remove("shown");
      picker.classList.add("hidden");
    }
    else {
      picker.classList.remove("hidden");
      picker.classList.add("shown");
    }
  }

  onPageSizeChange(value: number | 'All') {
    this.selectedPageSize.set(value); // Update the model
    this.setItemsPerPage(value); // Notify parent to run logic (like resetting page index)
  }

  setItemsPerPage(value: number | 'All') {
    this.itemsPerPage =
      value === 'All' ? this.totalItems() : value;

    this.p = 1;
    this.isTasksDropdownOpen = false;
  }

  filteredTasks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const status = this.selectedStatus();
    const range = this.dateRange();
    const sortField = this.sortField();
    const sortDirection = this.sortDirection();

    const filtered = this.tasks().filter(task => {

      const matchesSearch =
        !term || task.title.toLowerCase().includes(term);

      const matchesStatus =
        !status || task.status === status;

      let matchesDate = true;

      if (range?.startDate && range?.endDate) {
        const taskDate = dayjs(task.dueDate).format('YYYY-MM-DD');
        const startDate = dayjs(range.startDate).format('YYYY-MM-DD');
        const endDate = dayjs(range.endDate).format('YYYY-MM-DD');

        matchesDate =
          taskDate >= startDate &&
          taskDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });

    return filtered.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'title') {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }

      return sortDirection === 'asc'
        ? valA > valB ? 1 : -1
        : valA < valB ? 1 : -1;
    });
  });

  isDialogClosed: boolean = true;
  toggleDialog() {
    this.isDialogClosed = !this.isDialogClosed;

    document.body.classList.toggle('body-lock', !this.isDialogClosed);

    if (this.isDialogClosed) {
      this.resetForm();
    }
  }

  resetForm() {
    this.taskForm.reset({
      title: '',
      dueDate: '',
      status: 'Incomplete'
    });
    this.taskForm.enable();
  }

}
