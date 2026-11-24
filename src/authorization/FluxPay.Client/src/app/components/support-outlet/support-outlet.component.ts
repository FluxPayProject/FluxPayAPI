import { NotificationService } from '../../services/common/notification.service';
import {listLoaderAnimation, rightBarAnimation} from '../../animations/outlet-animations';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import { animate, style, transition, trigger } from "@angular/animations";
import {TicketsApiService} from "../../services/api/tickets-api.service";
import {debounceTime, filter, firstValueFrom, fromEvent, Subscription} from "rxjs";
import {SupportTicketStateService} from "../../services/state/support-ticket-state.service";
import {ProfileStateService} from "../../services/state/profile-state.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  selector: 'app-support-outlet',
  templateUrl: './support-outlet.component.html',
  styleUrls: ['./support-outlet.component.scss'],
  animations: [
    trigger("supportTicketListAnimation", [
      transition(":enter", [
        style({ transform: 'translateY(-10px)', opacity: 0 }),
        animate(".3s", style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('supportTicketItemAnimation', [
      transition(':enter', [
        style({ height: 0, opacity: 0, "padding-top": 0, "padding-bottom": 0, margin: 0, "min-height": 0 }),
        animate('.4s', style({ height: "*", opacity: "*", "padding-top": "*", "padding-bottom": "*", margin: "*", "min-height": "*" }))
      ])
    ]),
    rightBarAnimation,
    listLoaderAnimation('ticketListLoaderAnimation')
  ]
})
export class SupportOutletComponent implements OnInit, OnDestroy {
  //common
  public transactionId: string = "";
  public ticketReason: string = "";

  //state
  public ticketListLoaderAnimation = false;

  //observable
  public supportTickets$ = this._supportTicketStateService.supportTickets$;
  public documentScrollSub$: Subscription | undefined;

  constructor(
      private _ticketsApiService: TicketsApiService,
      protected _supportTicketStateService: SupportTicketStateService,
      protected _profileStateService : ProfileStateService,
      private _messageService: NotificationService
  ) {}

  ngOnInit() {
    const date = new Date();
    if (this.supportTickets$.getValue().length === 0) {
      void this._supportTicketStateService.getSupportTicketsAsync(date, 10).catch(() => {
        this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not load support tickets.'});
      });
    }

    this.documentScrollSub$ = fromEvent<Event>(document, "scroll", {capture: true})
      .pipe(
        filter(event => event.target instanceof HTMLElement && event.target.tagName === 'APP-MAIN'),
        debounceTime(400))
      .subscribe(async e => {
        const target = e.target as HTMLElement;
        const distanceFromEnd = target.scrollHeight - target.clientHeight - target.scrollTop;
        if (!this.ticketListLoaderAnimation && distanceFromEnd <= 15) {
          this.ticketListLoaderAnimation = true;
          try {
            const tickets = this._supportTicketStateService.supportTickets$.getValue();
            const lastTicket = tickets[tickets.length - 1];
            if (lastTicket) await this._supportTicketStateService.getSupportTicketsAsync(lastTicket.createdAt, 10, lastTicket.id);
          } catch {
            this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not load more tickets.'});
          } finally {
            this.ticketListLoaderAnimation = false;
          }
        }
      });
  }

  ngOnDestroy() {
    this.documentScrollSub$?.unsubscribe();
  }

  //events
  protected readonly submittingTicket = signal(false);

  async onClickOpenSupportTicketHandler() {
    if (this.submittingTicket()) return;
    if (!this.transactionId.trim() || !this.ticketReason.trim()) {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Enter a transaction ID and a reason.'});
      return;
    }

    const walletId = this._profileStateService.user$.getValue()?.walletId ?? "";

    const openSupportTicket$ = this._ticketsApiService.openSupportTicket(walletId, this.transactionId, this.ticketReason);

    this.submittingTicket.set(true);
    try {
      await firstValueFrom(openSupportTicket$);
      this.transactionId = "";
      this.ticketReason = "";
    } catch {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not submit the ticket. Check the transaction ID and reason.'});
    } finally {
      this.submittingTicket.set(false);
    }
  }

}
