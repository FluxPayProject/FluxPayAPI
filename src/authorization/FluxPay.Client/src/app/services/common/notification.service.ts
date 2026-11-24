import { Injectable, signal } from '@angular/core';

interface Notification {
  severity: 'success' | 'error';
  summary: string;
  detail: string;
}

@Injectable({providedIn: 'root'})
export class NotificationService {
  private readonly queue = signal<(Notification & { id: number })[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;
  readonly messages = this.queue.asReadonly();

  add(message: Notification) {
    const id = this.nextId++;
    this.queue.update(messages => [...messages, {...message, id}]);
    this.timers.set(id, setTimeout(() => this.dismiss(id), 3000));
  }

  dismiss(id: number) {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.queue.update(messages => messages.filter(message => message.id !== id));
  }
}
