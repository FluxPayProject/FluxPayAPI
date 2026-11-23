import {Injectable, signal} from '@angular/core';

type PaymentForm = 'transfer' | 'deposit';

interface PendingPayment {
  id: string;
  resultDelayed: boolean;
  timer: ReturnType<typeof setTimeout>;
}

@Injectable({providedIn: 'root'})
export class PaymentSubmissionService {
  private readonly pending = signal<Partial<Record<PaymentForm, PendingPayment>>>({});
  private readonly resultTimeoutMs = 30_000;

  isPending(form: PaymentForm): boolean {
    return this.pending()[form] !== undefined;
  }

  isResultDelayed(form: PaymentForm): boolean {
    return this.pending()[form]?.resultDelayed ?? false;
  }

  start(form: PaymentForm): string | undefined {
    if (this.isPending(form)) return;
    const id = crypto.randomUUID();
    const timer = setTimeout(() => {
      this.pending.update(pending => {
        const payment = pending[form];
        return payment?.id === id
          ? {...pending, [form]: {...payment, resultDelayed: true}}
          : pending;
      });
    }, this.resultTimeoutMs);

    this.pending.update(pending => ({...pending, [form]: {id, timer, resultDelayed: false}}));
    return id;
  }

  finish(id?: string | null): boolean {
    if (!id) return false;

    const {transfer, deposit} = this.pending();
    if (id === transfer?.id) {
      clearTimeout(transfer.timer);
      this.pending.set({deposit});
      return true;
    }
    if (id === deposit?.id) {
      clearTimeout(deposit.timer);
      this.pending.set({transfer});
      return true;
    }
    return false;
  }
}
