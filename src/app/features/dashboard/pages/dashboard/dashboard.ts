import { Component, effect, inject, OnInit, Signal, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { TaskService } from '@core/services/task';
import { signal, computed } from '@angular/core';
import { Task } from '@core/models/Task';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import dayjs from 'dayjs';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { StatsCard } from '@features/dashboard/components/stats-card/stats-card';
import { TaskFilters } from '@features/dashboard/components/task-filters/task-filters';
import { TaskTable } from '@features/dashboard/components/task-table/task-table';
import { TaskDialog } from '@features/dashboard/components/task-dialog/task-dialog';

export type TaskStatus = 'Incomplete' | 'Completed' | 'InProgress';
@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CommonModule, NgxDaterangepickerMd, FormsModule, NgxPaginationModule, NgSelectModule, StatsCard, TaskFilters, TaskTable, TaskDialog],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  clearFilters(): void {
    // Clear search box
    this.searchControl.setValue('');

    // Reset date range (show all dates)
    this.dateRange.set(null);

    // Reset status filter to "All"
    this.selectedStatus.set(null);

    // Reset tasks per page to default (5)
    this.selectedPageSize.set(5);
    this.itemsPerPage = 5;

    // Reset pagination to first page
    this.p = 1;
  }

  isDialogClosed: boolean = true;
  toggleDialog() {
    this.isDialogClosed = !this.isDialogClosed;

    document.body.classList.toggle('body-lock', !this.isDialogClosed);

    if (this.isDialogClosed) {
      this.resetForm();
    }
  }

  fb = inject(FormBuilder);
  dateRange = signal<{ startDate: any; endDate: any } | null>(null);
  selectedStatus = signal<string | null>(null); // '' means All
  tasks!: Signal<Task[]>;
  searchControl = new FormControl('');
  searchTerm = signal('');
  editingTaskId: string | null = null;
  deletingTaskId: string | null = null;
  dialogTitle = signal('Add');
  isEditing = signal<boolean>(false);
  p: number = 1;
  itemsPerPage = 5;
  pageSizeOptions = [5, 10, 20, 'All'] as const;
  isTasksDropdownOpen = false;
  totalItems = computed(() => this.filteredTasks().length);
  selectedPageSize = signal<number | 'All'>(5);
  isDeleting = signal<boolean>(false);
  dialogDescription = signal('Add task details below');
  dialogTitleColor = signal('text-primary');
  filteredTasksCount = computed(() => this.filteredTasks().length);
  dialogSubmitText = signal('Save');
  sortField = signal<'title' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');
  statusOptions = [
    { label: 'All', value: null },
    { label: 'Completed', value: 'Completed' },
    { label: 'In Progress', value: 'InProgress' },
    { label: 'Incomplete', value: 'Incomplete' }
  ];
  isLoading = computed(() => this.taskService.loading());

  constructor(public taskService: TaskService, private toastr: ToastrService) {
    this.tasks = this.taskService.tasks;
  }

  syncAllPageSizeEffect = effect(() => {
    if (this.selectedPageSize() === 'All') {
      this.itemsPerPage = this.totalItems();
      this.p = 1;
    }
  });

  ngOnInit() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300))
      .subscribe(value => {
        this.searchTerm.set(value || '');
      });
  }

  ngOnDestroy() {
    document.body.classList.remove('body-lock');
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

  sortBy(field: 'title' | 'createdAt') {
    if (this.sortField() === field) {
      this.sortDirection.set(
        this.sortDirection() === 'asc' ? 'desc' : 'asc'
      );
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  openTasksDropdown(event: Event) {
    event.stopPropagation();
    this.isTasksDropdownOpen = !this.isTasksDropdownOpen;
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

  async submit() {
    if (this.taskForm.invalid) return;

    const value = this.taskForm.getRawValue();

    if (this.editingTaskId) {
      await this.taskService.updateTask({
        ...value,
        id: this.editingTaskId
      } as Task);
    }
    else if (this.isDeleting()) {
      await this.taskService.deleteTask(this.deletingTaskId!);
    }
    else {
      await this.taskService.addTask(value as Task);
    }

    if (this.isEditing()) {
      this.toastr.success('Task Updated successfully', 'Success');
    }
    else if (this.isDeleting()) {
      this.toastr.success('Task Deleted successfully', 'Success');
    }
    else {
      this.toastr.success('Task Added successfully', 'Success');
    }
    this.resetForm();
    this.toggleDialog();
  }

  delete(task: Task) {

    this.dialogTitle.set('Delete');
    this.isDeleting.set(true);
    this.deletingTaskId = task.id!;
    this.taskForm.patchValue({
      title: task.title,
      dueDate: task.dueDate,
      status: task.status
    });

    this.taskForm.disable();
    this.dialogDescription = signal('Do you really want to delete this task?');
    this.dialogTitleColor.set('text-danger');
    this.dialogSubmitText = signal('Delete');
    this.toggleDialog();

  }

  /**
   * Opens the dialog for editing a task.
   * The dialog title is set to 'Edit' and the form is populated with the task's details.
   * The dialog description is set to 'Edit task details below' and the submit button text is set to 'Update'.
   * The dialog title color is set to 'text-warn'.
   * @param task The task to edit.
   */
  edit(task: Task) {
    this.dialogTitle.set('Edit');
    this.isEditing.set(true);
    this.editingTaskId = task.id!;
    this.taskForm.patchValue({
      title: task.title,
      dueDate: task.dueDate,
      status: task.status
    });
    this.dialogDescription = signal('Edit task details below');
    this.dialogTitleColor.set('text-warn');
    this.dialogSubmitText = signal('Update');
    this.toggleDialog();
  }

  /**
   * Resets the form and its related state variables.
   * It is called when the user clicks the cancel button on the dialog.
   * It resets the form values to their default values,
   * resets the editingTaskId to null,
   * sets isEditing and isDeleting to false,
   * sets the dialog title, description, title color and submit text,
   * and enables the form.
   */
  resetForm() {
    this.taskForm.reset({
      title: '',
      dueDate: '',
      status: 'Incomplete'
    });

    this.editingTaskId = null;
    this.isEditing.set(false);
    this.isDeleting.set(false);
    this.dialogTitle.set('Add');
    this.dialogDescription.set('Add task details below');
    this.dialogTitleColor.set('text-primary');
    this.dialogSubmitText = signal('Save');
    this.taskForm.enable();
  }


  /**
   * Resets the form and closes the dialog.
   * Called when the user clicks the cancel button on the dialog.
   */
  cancelDialog() {
    this.resetForm();
    this.toggleDialog();
  }

}