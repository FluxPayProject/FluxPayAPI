import { Component, inject } from '@angular/core';
import { NotificationService } from '../../services/common/notification.service';

@Component({
  selector: 'app-notifications',
  template: `
    <div class="notifications" aria-label="Notifications">
      @for (message of notifications.messages(); track message.id) {
        <div class="notice" [class.error]="message.severity === 'error'">
          <div [attr.role]="message.severity === 'error' ? 'alert' : 'status'">
            <strong>{{ message.summary }}</strong>
            <p>{{ message.detail }}</p>
          </div>
          <button type="button" aria-label="Dismiss notification" (click)="notifications.dismiss(message.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .notifications { position: fixed; z-index: 1100; top: 20px; right: 20px; width: min(25rem, calc(100% - 40px)); }
    .notice { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px;
      padding: 14px; border: 1px solid #94d7b2; border-radius: 8px; background: #effbf4; color: #176443;
      box-shadow: 0 4px 10px #0002; font-size: 14px; line-height: 1.35; }
    .error { border-color: #f2a9b0; background: #fff1f2; color: #a11c2e; }
    strong { font-weight: 700; }
    p { margin-top: 4px; overflow-wrap: anywhere; }
    button { border: 0; background: transparent; color: inherit; cursor: pointer; font-size: 20px; line-height: 1; }
  `,
})
export class NotificationsComponent {
  protected readonly notifications = inject(NotificationService);
}
