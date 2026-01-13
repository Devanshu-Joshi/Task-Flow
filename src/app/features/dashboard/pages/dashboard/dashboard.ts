import { Component, effect, ElementRef, HostListener, inject, OnInit, Signal, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { TaskService } from '../../../../core/services/task';
import { signal, computed } from '@angular/core';
import { Task } from '../../../../core/models/Task';
import { debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgxDaterangepickerMd } from 'ngx-daterangepicker-material';
import dayjs from 'dayjs';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { ToastrService } from 'ngx-toastr';

export type TaskStatus = 'Incomplete' | 'Completed' | 'InProgress';
@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule, CommonModule, NgxDaterangepickerMd, FormsModule, NgxPaginationModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  isDialogClosed: boolean = true;
  toggleDialog() {
    console.log(this.isDeleting());
    this.isDialogClosed = !this.isDialogClosed;
    if (this.isDialogClosed) {
      this.resetForm();
    }
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
  deletingTaskId: string | null = null;
  dialogTitle = signal('Add');
  isEditing = signal<boolean>(false);
  @ViewChild('dateRangeInput') dateRangeInput!: ElementRef<HTMLInputElement>;
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
  @ViewChild('statusDropdown') statusDropdown!: ElementRef;
  dialogSubmitText = signal('Save');
  sortField = signal<'title' | 'createdAt'>('createdAt');
  sortDirection = signal<'asc' | 'desc'>('desc');

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

  ngAfterViewInit() {
    this.dateRangeInput.nativeElement.value = '';
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

  openStatusDropdown(event: MouseEvent) {
    event.stopPropagation();

    if (this.showStatusDropdown) {
      this.closeStatusDropdown();
      return;
    }

    const button = (event.target as HTMLElement).closest('button');
    if (!button) return;

    const rect = button.getBoundingClientRect();

    this.dropdownPosition = {
      top: rect.bottom + 6,
      left: rect.left
    };

    this.showStatusDropdown = true;
  }

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
    this.selectedPageSize.set(value);

    this.itemsPerPage =
      value === 'All' ? this.totalItems() : value;

    this.p = 1;
    this.isTasksDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (
      this.showStatusDropdown &&
      this.statusDropdown &&
      !this.statusDropdown.nativeElement.contains(target)
    ) {
      this.closeStatusDropdown();
    }

    this.isTasksDropdownOpen = false;
  }

  closeStatusDropdown() {
    this.showStatusDropdown = false;
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

    // 🔽 SORTING LOGIC
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

  selectStatus(status: string) {
    this.selectedStatus.set(status);
    this.showStatusDropdown = false;
  }

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

  cancelDialog() {
    this.resetForm();
    this.toggleDialog();
  }

}