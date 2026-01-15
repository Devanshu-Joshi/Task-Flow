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
  Firestore,
  updateDoc
} from '@angular/fire/firestore';
import { Unsubscribe } from 'firebase/auth';
import { AuthService } from './auth';
import { Task } from '@core/models/Task';
// export let isEditing = signal<boolean>(false);

@Injectable({ providedIn: 'root' })
export class TaskService {

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal<boolean>(true);

  private unsubscribeTasks?: Unsubscribe;

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {
    this.listenToAuth();
  }

  private listenToAuth() {
    this.authService.user$.subscribe(user => {

      this.unsubscribeTasks?.();
      this.unsubscribeTasks = undefined;
      this.tasks.set([]);
      this.loading.set(true);

      if (!user) {
        this.loading.set(false);
        return;
      }

      this.startTaskListener(user.uid);
    });
  }

  private startTaskListener(uid: string) {
    const q = query(
      collection(this.firestore, 'tasks'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );

    let firstSnapshot = true;

    this.unsubscribeTasks = onSnapshot(
      q,
      snapshot => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }) as Task);

        this.tasks.set(tasks);

        if (firstSnapshot) {
          this.loading.set(false);
          firstSnapshot = false;
        }
      },
      error => {
        console.error('Firestore task listener error:', error);
        this.loading.set(false);
      }
    );
  }

  async addTask(task: Task) {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    await addDoc(collection(this.firestore, 'tasks'), {
      title: task.title.trim(),
      dueDate: task.dueDate,
      status: task.status,
      createdAt: Date.now(),
      userId: user.uid
    });
  }

  async updateTask(task: Task) {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');
    if (!task.id) throw new Error('Task ID is required');

    const taskRef = doc(this.firestore, 'tasks', task.id);
    const snap = await getDoc(taskRef);

    if (!snap.exists()) throw new Error('Task not found');
    if (snap.data()['userId'] !== user.uid)
      throw new Error('Unauthorized edit attempt');

    await updateDoc(taskRef, {
      title: task.title.trim(),
      dueDate: task.dueDate,
      status: task.status
    });
  }

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