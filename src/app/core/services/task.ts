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
import { Task } from '../models/Task';
export let isEditing = signal<boolean>(false);

@Injectable({ providedIn: 'root' })
export class TaskService {

  readonly tasks = signal<Task[]>([]);

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

      if (!user) {
        this.tasks.set([]);
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

  async addTask(task: Task) {
    const user = this.authService.currentUser;
    if (!user) throw new Error('User not authenticated');

    if (isEditing()) {
      const taskRef = doc(this.firestore, 'tasks', task.id!);
      const snap = await getDoc(taskRef);

      if (!snap.exists()) throw new Error('Task not found');
      if (snap.data()['userId'] !== user.uid)
        throw new Error('Unauthorized edit attempt');

      await updateDoc(taskRef, {
        title: task.title.trim(),
        dueDate: task.dueDate,
        status: task.status
      });

      isEditing.set(false);
      return;
    }

    await addDoc(collection(this.firestore, 'tasks'), {
      title: task.title.trim(),
      dueDate: task.dueDate,
      status: task.status,
      createdAt: Date.now(),
      userId: user.uid
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