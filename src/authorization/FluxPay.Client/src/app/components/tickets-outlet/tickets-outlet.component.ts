import { NotificationService } from '../../services/common/notification.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {Component, OnDestroy, OnInit, signal} from '@angular/core';
import {animate, style, transition, trigger} from "@angular/animations";
import {TicketStateService} from "../../services/state/ticket-state.service";
import {ISupportTicketDto} from "../../types/interfaces/consumer/ISupportTicketDto";
import {debounceTime, firstValueFrom, fromEvent, Subscription} from "rxjs";
import {TransactionsApiService} from "../../services/api/transactions-api.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule],
  selector: 'app-tickets-outlet',
  templateUrl: './tickets-outlet.component.html',
  styleUrls: ['./tickets-outlet.component.scss'],
  animations: [
    trigger("ticketListAnimation", [
      transition(":enter", [
        style({transform: 'translateY(-10px)', opacity: 0}),
        animate(".3s", style({transform: 'translateY(0)', opacity: 1}))
      ])
    ]),
    trigger('ticketItemAnimation', [
      transition(':leave', [
        style({margin: 0}),
        animate('.3s', style({ height: 0, opacity: 0, "padding-top": 0, "padding-bottom": 0, "min-height": 0 }))
      ])
    ]),
    trigger("ticketListLoaderAnimation", [
      transition(":enter", [
        style({transform: 'translateY(10px)', opacity: 0}),
        animate('.25s', style({transform: 'translateY(0px)', opacity: 1}))
      ]),
      transition(":leave", [
        style({transform: 'translateY(0px)', opacity: 1}),
        animate('.25s', style({transform: 'translateY(10px)', opacity: 0}))
      ])
    ])
  ]
})
export class TicketsOutletComponent implements OnInit, OnDestroy {
  //common
  protected readonly rollbackRequests = signal<ReadonlySet<string>>(new Set());
  protected readonly pendingRollbacks = signal<ReadonlySet<string>>(new Set());

  //state
  public ticketListLoaderAnimation = false;
  protected readonly resolvingTickets = signal<ReadonlySet<string>>(new Set());

  //observable
  public tickets$ = this._ticketStateService.tickets$;
  public documentScrollSub$: Subscription | undefined;

  constructor(
    protected _ticketStateService: TicketStateService,
    private _transactionApiService: TransactionsApiService,
    private _messageService: NotificationService
  ) {}

  ngOnInit() {
    const date = new Date();
    if (this.tickets$.getValue().length === 0) {
      void this._ticketStateService.getTicketsAsync(date, 10).catch(() => {
        this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not load tickets.'});
      });
    }

    this.documentScrollSub$ = fromEvent(document, "scroll")
      .pipe(
        debounceTime(400))
      .subscribe(async e => {
        const event = e as Event;
        const target = event.target as Document;
        if (this.ticketListLoaderAnimation || target.body.scrollHeight - window.innerHeight > window.scrollY + 15) return;
        const lastTicket = this.tickets$.getValue().at(-1);
        if (!lastTicket) return;

        this.ticketListLoaderAnimation = true;
        try {
          await this._ticketStateService.getTicketsAsync(lastTicket.createdAt, 10, lastTicket.id);
        } catch {
          this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not load more tickets.'});
        } finally {
          this.ticketListLoaderAnimation = false;
        }
      });
  }

  ngOnDestroy() {
    this.documentScrollSub$?.unsubscribe();
  }

  //events
  async onClickResolveTicketHandler(ticketId: string, ticketJustification: string) {
    if (this.resolvingTickets().has(ticketId)) return;
    if (!ticketJustification?.trim()) {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Enter a reply before resolving the ticket.'});
      return;
    }

    this.resolvingTickets.update(ids => new Set(ids).add(ticketId));
    try {
      await this._ticketStateService.resolveTicketAsync(ticketId, ticketJustification);
    } catch {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not resolve the ticket.'});
    } finally {
      this.resolvingTickets.update(ids => new Set([...ids].filter(id => id !== ticketId)));
    }
  }

  async onClickRollBackHandler(transactionId: string) {
    if (this.pendingRollbacks().has(transactionId) || this.rollbackRequests().has(transactionId)) return;

    this.pendingRollbacks.update(ids => new Set(ids).add(transactionId));
    try {
      await firstValueFrom(this._transactionApiService.rollBackTransaction(transactionId));
      this.rollbackRequests.update(ids => new Set(ids).add(transactionId));
    } catch {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not request a rollback.'});
    } finally {
      this.pendingRollbacks.update(ids => new Set([...ids].filter(id => id !== transactionId)));
    }
  }

  //other
  identifyTicketDto(index: number, item: ISupportTicketDto){
    return item.id;
  }
}
