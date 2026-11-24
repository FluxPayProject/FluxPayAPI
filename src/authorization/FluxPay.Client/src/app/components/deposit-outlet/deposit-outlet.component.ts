import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaymentNetwork } from '../../types/enums/PaymentNetwork';
import { NotificationService } from '../../services/common/notification.service';
import {PaymentSubmissionService} from "../../services/state/payment-submission.service";
import { FormsModule } from '@angular/forms';
import { CdkMenuModule } from '@angular/cdk/menu';
import { ICreditCardDto } from '../../types/interfaces/consumer/ICreditCardDto';
import { parseEuroAmount, updateEuroAmount } from '../../services/common/euro-amount';
import {Component, OnInit, signal} from '@angular/core';
import { animate, style, transition, trigger } from "@angular/animations";
import {TransactionsApiService} from "../../services/api/transactions-api.service";
import {firstValueFrom} from "rxjs";
import {CreditCardsStateService} from "../../services/state/credit-cards-state.service";

@Component({
  standalone: true,
  imports: [AsyncPipe, FormsModule, RouterLink, CdkMenuModule],
  selector: 'app-deposit-outlet',
  templateUrl: './deposit-outlet.component.html',
  styleUrls: ['./deposit-outlet.component.scss'],
  animations: [
    trigger('depositFormAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(10px)', opacity: 0 }),
        animate('.25s', style({ transform: 'translateY(0px)', opacity: 1 }))
      ])
    ])
  ]
})
export class DepositOutletComponent implements OnInit{
  //common
  protected readonly creditCardId = signal('');
  public amount: string = "";
  protected readonly cards$ = this._creditCardStateService.cards$;
  protected readonly cardsLoaded = signal(false);
  protected cardLabel(card: ICreditCardDto): string {
    const network = card.paymentNetwork === PaymentNetwork.Visa ? 'Visa' : 'Mastercard';
    return network + ' •••• ' + card.cardNumber.slice(-4);
  }

  protected selectedCardLabel(cards: ICreditCardDto[]): string {
    const selected = cards.find(card => card.id === this.creditCardId());
    return selected ? this.cardLabel(selected) : 'Choose a card';
  }

  protected updateAmount(field: HTMLInputElement) {
    this.amount = updateEuroAmount(field, this.amount);
  }

  constructor(
      private _transactionsApiService: TransactionsApiService,
      private _creditCardStateService: CreditCardsStateService,
      private _messageService: NotificationService,
    protected paymentSubmission: PaymentSubmissionService
  ) {}

  async ngOnInit() {
    try {
      await this._creditCardStateService.getCreditCardsAsync();
      this.cardsLoaded.set(true);
    } catch {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not load payment cards.'});
    }
  }

  //events
  public async onClickTopUpAccountBalanceHandler() {
    const amount = parseEuroAmount(this.amount);
    if (!this.cards$.value.some(card => card.id === this.creditCardId()) || amount === null) {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Select a card and enter an amount greater than zero.'});
      return;
    }
    const operationId = this.paymentSubmission.start('deposit');
    if (!operationId) return;

    const topUpAccountBalance$ = this._transactionsApiService.topUpAccountBalance(this.creditCardId(), amount, operationId);

    try {
      // The sender acknowledges receipt before the consumer finishes processing.
      // Keep the values available if the asynchronous result is an error.
      await firstValueFrom(topUpAccountBalance$);
    } catch {
      this.paymentSubmission.finish(operationId);
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not submit the deposit.'});
    }
  }
}
