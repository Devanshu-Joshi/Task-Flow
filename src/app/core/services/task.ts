import { Injectable, signal } from '@angular/core';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  Firestore
} from '@angular/fire/firestore';
import { Unsubscribe } from 'firebase/auth';
import { AuthService } from './auth';

export interface Task {
  id?: string;
  title: string;
  status: 'Incomplete' | 'Completed' | 'InProgress';
  dueDate: string;
  createdAt: number;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {

  /** ✅ Reactive task state (single source of truth) */
  readonly tasks = signal<Task[]>([]);

  private unsubscribeTasks?: Unsubscribe;

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.listenToAuth();
  }

  /* ---------------------------------- */
  /* 🔐 AUTH → TASKS CONNECTION */
  /* ---------------------------------- */

  private listenToAuth() {
    this.authService.user$.subscribe(user => {

      // Cleanup old listener
      this.unsubscribeTasks?.();
      this.unsubscribeTasks = undefined;

      if (!user) {
        this.tasks.set([]);
        return;
      }

      this.startTaskListener(user.uid);
    });
  }

  /* ---------------------------------- */
  /* 🔥 FIRESTORE REALTIME LISTENER */
  /* ---------------------------------- */

  private startTaskListener(uid: string) {
    const q = query(
      collection(this.firestore, 'tasks'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    this.unsubscribeTasks = onSnapshot(
      q,
      snapshot => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Task);

        this.tasks.set(tasks);
      },
      error => {
        console.error('Firestore task listener error:', error);
      }
    );
  }

  /* ---------------------------------- */
  /* ➕ ADD TASK */
  /* ---------------------------------- */

  async addTask(task: {
    title: string;
    dueDate: string;
    status: Task['status'];
  }) {
    const user = this.authService.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const newTask: Task = {
      title: task.title.trim(),
      dueDate: task.dueDate,
      status: task.status,
      createdAt: Date.now(),
      userId: user.uid
    };

    await addDoc(collection(this.firestore, 'tasks'), newTask);
  }

  /* ---------------------------------- */
  /* ❌ DELETE TASK */
  /* ---------------------------------- */

  async deleteTask(taskId: string) {
    const user = this.authService.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const taskRef = doc(this.firestore, 'tasks', taskId);
    const snap = await getDoc(taskRef);

    if (!snap.exists()) {
      throw new Error('Task not found');
    }

    if (snap.data()['userId'] !== user.uid) {
      throw new Error('Unauthorized delete attempt');
    }

    await deleteDoc(taskRef);
  }
}