import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Task, TaskView } from '@core/models/Task';
import { UserAuth } from './user-auth';

@Injectable({ providedIn: 'root' })
export class TaskService {

  private readonly API_URL = 'http://localhost:3080/api/tasks';

  // ✅ Store RAW backend data only
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // ✅ UI-only transformation
  readonly tasksView = computed<TaskView[]>(() =>
    [...this.tasks()]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((task, index) => ({
        ...task,
        displayId: index + 1
      }))
  );

  constructor(
    private http: HttpClient,
    private authService: UserAuth
  ) {
    this.listenToAuth();
  }

  /* -------------------------
   * Auth-driven sync
   * ------------------------- */
  private listenToAuth() {
    effect(() => {
      const user = this.authService.user();

      this.tasks.set([]);
      this.error.set(null);

      if (!user) {
        this.loading.set(false);
        return;
      }

      this.fetchTasks();
    });
  }

  /* -------------------------
   * API calls
   * ------------------------- */

  fetchTasks() {
    alert("Loading...");
    this.loading.set(true);

    this.http.get<Task[]>(this.API_URL + "/getTasksByParent").subscribe({
      next: tasks => {
        alert("Loading Completed");
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        alert("Loading Error");
        this.error.set('Failed to load tasks');
        this.loading.set(false);
      }
    });
  }

  /* -------------------------
   * Mutations (NO TaskView)
   * ------------------------- */

  addTask(payload: Pick<Task, 'title' | 'dueDate' | 'status' | 'priority' | 'assignedTo'>) {
    return this.http.post<Task>(this.API_URL, payload).subscribe({
      next: createdTask => {
        this.tasks.update(tasks => [...tasks, createdTask]);
      }
    });
  }

  updateTask(taskId: string, payload: Partial<Task>) {
    return this.http.put<Task>(`${this.API_URL}/${taskId}`, payload).subscribe({
      next: updatedTask => {
        this.tasks.update(tasks =>
          tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        );
      }
    });
  }

  deleteTask(taskId: string) {
    return this.http.delete<void>(`${this.API_URL}/${taskId}`).subscribe({
      next: () => {
        this.tasks.update(tasks =>
          tasks.filter(t => t.id !== taskId)
        );
      }
    });
  }

  /* -------------------------
   * Manual sync
   * ------------------------- */
  refresh() {
    this.fetchTasks();
  }
}