import { NotificationService } from '../../services/common/notification.service';
import { NgxMaskDirective } from 'ngx-mask';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {Component, ElementRef, OnInit, signal, ViewChild} from '@angular/core';
import {animate, query, stagger, style, transition, trigger} from "@angular/animations";
import {PaymentNetwork} from "../../types/enums/PaymentNetwork";
import {CreditCardsStateService} from "../../services/state/credit-cards-state.service";
import { ProfileStateService } from '../../services/state/profile-state.service';
import {ICreditCardDto} from "../../types/interfaces/consumer/ICreditCardDto";
import {TextService} from "../../services/common/text.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule, NgxMaskDirective],
  selector: 'app-cards-outlet',
  templateUrl: './cards-outlet.component.html',
  styleUrls: ['./cards-outlet.component.scss'],
  animations: [
    trigger('cardListAnimation', [
      transition(':enter', [
        query(':enter', style({ transform: 'translateY(-5px)', opacity: 0 }), { optional: true }),
        query(':enter', stagger('100ms', [animate('200ms', style({ transform: 'translateY(0)', opacity: 1 }))]), { optional: true })
      ])
    ]),
    trigger("cardItemAnimation", [
      transition(":enter", [
        style({opacity: 0}),
        animate(".3s", style({opacity: "*"}))
      ])
    ]),
    trigger('rightBarAnimation', [
      transition(':enter', [
        style({ transform: 'translateY(10px)', opacity: 0 }),
        animate('.25s', style({ transform: 'translateY(0px)', opacity: 1 }))
      ])
    ])
  ]
})
export class CardsOutletComponent implements OnInit {
  //observable
  public cards$ = this._creditCardsStateService.cards$;

  @ViewChild('removeCardDialog') private removeCardDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('addCardButton') private addCardButton!: ElementRef<HTMLButtonElement>;

  protected removal: { id: string; lastFour: string; trigger: HTMLButtonElement } | null = null;
  protected readonly removingCard = signal(false);
  protected readonly removalFailed = signal(false);

  // input data
  public cardHolderName = '';
  public cardNumber = '';
  public expiration = '';
  public cvv = '';
  public PaymentNetwork = PaymentNetwork;

  constructor(
    protected _creditCardsStateService: CreditCardsStateService,
    protected _profileStateService: ProfileStateService,
    protected _textService: TextService,
    private _messageService: NotificationService) {

  }

  async ngOnInit() {
    if (!this._profileStateService.isAuthenticated) return;

    await this._creditCardsStateService.getCreditCardsAsync();
  }

  protected get detectedPaymentNetwork(): PaymentNetwork | null {
    if (this.cardNumber.startsWith('4')) return PaymentNetwork.Visa;
    if (/^5[1-5]/.test(this.cardNumber)) return PaymentNetwork.MasterCard;

    const prefix = Number(this.cardNumber.slice(0, 4));
    return prefix >= 2221 && prefix <= 2720 ? PaymentNetwork.MasterCard : null;
  }

  //events
  protected openRemoval(card: ICreditCardDto, trigger: HTMLButtonElement) {
    this.removal = {id: card.id, lastFour: card.cardNumber.slice(-4), trigger};
    this.removalFailed.set(false);
    this.removeCardDialog.nativeElement.showModal();
  }

  protected onRemovalCancel(event: Event) {
    if (this.removingCard()) event.preventDefault();
  }

  protected onRemovalClosed() {
    const trigger = this.removal?.trigger;
    this.removal = null;
    (trigger?.isConnected ? trigger : this.addCardButton.nativeElement).focus();
  }

  protected async confirmRemoval() {
    if (!this.removal || this.removingCard()) return;

    this.removalFailed.set(false);
    this.removingCard.set(true);
    try {
      await this._creditCardsStateService.deleteCreditCardAsync(this.removal.id);
      this.removeCardDialog.nativeElement.close();
    } catch {
      this.removalFailed.set(true);
    } finally {
      this.removingCard.set(false);
    }
  }

  async onAttachCardOkClick() {
    if (!this.cardHolderName.trim() || !/^\d{16}$/.test(this.cardNumber) ||
        !/^\d{4}$/.test(this.expiration) || !/^\d{3}$/.test(this.cvv)) {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Enter a cardholder name, 16-digit card number, expiry date and 3-digit security code.'});
      return;
    }

    const network = this.detectedPaymentNetwork;
    if (network === null) {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Only Visa and Mastercard are supported.'});
      return;
    }

    const month = Number(this.expiration.slice(0, 2));
    const year = 2000 + Number(this.expiration.slice(2));
    const now = new Date();
    if (month < 1 || month > 12 || year < now.getFullYear() ||
        (year === now.getFullYear() && month < now.getMonth() + 1)) {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Enter a valid, unexpired expiry date.'});
      return;
    }

    const expiration = this.expiration.slice(0, 2) + "/" + this.expiration.slice(2);

    const cardHolderName = this.cardHolderName;
    const cardNumber = this.cardNumber;
    const cvv = this.cvv;

    try {
      await this._creditCardsStateService.attachCreditCardToAccountAsync(
        cardHolderName,
        cardNumber,
        expiration,
        cvv,
        network);
      if (this.cardHolderName === cardHolderName) this.cardHolderName = "";
      if (this.cardNumber === cardNumber) this.cardNumber = "";
      if (this.expiration === expiration.replace('/', '')) this.expiration = "";
      if (this.cvv === cvv) this.cvv = "";
    } catch {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not add the card.'});
    }
  }

  //other
  identifyCardDto(index: number, item: ICreditCardDto){
    return item.id;
  }
}
