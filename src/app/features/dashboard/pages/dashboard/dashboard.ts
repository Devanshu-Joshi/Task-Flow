import { Component, inject, Signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../../../core/services/task';
import { computed } from '@angular/core';
import { Task } from '../../../../core/models/Task';
import { PostService } from '../../../../core/services/post';

export type TaskStatus = 'Incomplete' | 'Completed' | 'InProgress';
@Component({
  selector: 'app-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  isDialogClosed: boolean = true;
  toggleDialog() {
    this.isDialogClosed = !this.isDialogClosed;
  }

  fb = inject(FormBuilder);
  tasks!: Signal<Task[]>;

  constructor(public taskService: TaskService, private postService: PostService) {
    this.tasks = this.taskService.tasks;
  }

  totalTasks = computed(() => this.tasks().length);

  completedTasks = computed(
    () => this.tasks().filter(task => task.status === 'Completed').length
  );

  inProgressTasks = computed(
    () => this.tasks().filter(t => t.status === 'InProgress').length
  );

  taskForm = this.fb.nonNullable.group({
    title: ['', [
      Validators.required,
      Validators.minLength(3)
    ]],
    dueDate: ['', Validators.required],
    status: ['Incomplete' as TaskStatus, Validators.required]
  });

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

  getPosts() {
    const data = this.postService.getPosts();
    data.subscribe((data) => console.log(data));

    const dataOfOnePost = this.postService.getPost(49);
    dataOfOnePost.subscribe((dataOfOnePost) => console.log(dataOfOnePost));
  }

}