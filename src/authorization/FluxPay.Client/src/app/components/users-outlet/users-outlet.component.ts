import { AvatarComponent } from '../avatar/avatar.component';
import { NotificationService } from '../../services/common/notification.service';
import { CdkMenuModule } from '@angular/cdk/menu';
import { CopyTextDirective } from '../../directives/copy-text.directive';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {A11yModule} from '@angular/cdk/a11y';
import {Component, ElementRef, HostListener, OnInit, signal, ViewChild} from '@angular/core';
import {animate, query, stagger, style, transition, trigger} from "@angular/animations";
import {UsersStateService} from "../../services/state/users-state.service";
import {BehaviorSubject, debounceTime, filter, firstValueFrom, Subject} from "rxjs";
import {TextService} from "../../services/common/text.service";
import {IUserDto} from "../../types/interfaces/consumer/IUserDto";
import {ProfileStateService} from "../../services/state/profile-state.service";
import {UserStatus} from "../../types/enums/UserStatus";
import {UsersApiService} from "../../services/api/users-api.service";
import {TransactionsApiService} from "../../services/api/transactions-api.service";
import {ITransactionDto} from "../../types/interfaces/consumer/ITransactionDto";
import {DateService} from "../../services/common/date.service";
import {TransactionState} from "../../types/enums/TransactionState";
import {ErrorMessageConstants} from "../../constants/ErrorMessageConstants";

@Component({
  standalone: true,
  imports: [AvatarComponent, CdkMenuModule, CommonModule, FormsModule, AngularSvgIconModule, CopyTextDirective, A11yModule],
  selector: 'app-users-outlet',
  templateUrl: './users-outlet.component.html',
  styleUrls: ['./users-outlet.component.scss'],
  animations: [
    trigger('userListAnimation', [
      transition(':enter', [
        query(':enter', style({ marginTop: -5, opacity: 0 }), { optional: true }),
        query(':enter', stagger('50ms', [
          animate('150ms', style({ marginTop: 0, opacity: 1 }))
        ]), { optional: true })
      ])
    ]),
  ]
})
export class UsersOutletComponent implements OnInit {
  @ViewChild('closeUserInfoButton') set closeUserInfoButton(button: ElementRef<HTMLButtonElement> | undefined) {
    button?.nativeElement.focus();
  }
  private previousFocus: HTMLElement | null = null;

  @HostListener('document:keydown.escape') onEscape() {
    if (this.showUserInfoWindow) this.closeUserTransactionsInfo();
  }

  //notifiers
  public transactionListScrolledToEndNotifier$ = new Subject<void>();

  //observable
  public users$ = this._usersStateService.users$;
  public currentUserInfo$ = new BehaviorSubject<IUserDto | null>(null);
  public currentUserTransactionsInfo$ = new BehaviorSubject<ITransactionDto[]>([]);
  public searchedUsers$ = this._usersStateService.searchedUsers$;
  public searchText$ = new BehaviorSubject<string>("");

  //state
  public currentUserTransactionsInfoLoader = false;
  public showUserInfoWindow = false;
  //types
  public UserStatus = UserStatus;
  protected readonly changingStatus = signal<ReadonlySet<string>>(new Set());

  constructor(
      private _usersApiService: UsersApiService,
      private notifications: NotificationService,
      protected _usersStateService: UsersStateService,
      protected _transactionsApiService: TransactionsApiService,
      protected _profileStateService: ProfileStateService,
      protected _textService: TextService,
      protected _dateService: DateService
  ) {}

  async ngOnInit() {
    if (!this._profileStateService.isAuthenticated) return;

    await this._usersStateService.getUsersAsync(25, 1);

    this.searchText$
        .pipe(
            filter(x => x.trim() !== ''),
            debounceTime(400))
        .subscribe(async x => await this._usersStateService.getSearchUsersAsync(x, 25, 1));

    this.searchText$
        .pipe(filter(x => x === ''))
        .subscribe(_ => this._usersStateService.clearSearchedUsers())

    this.transactionListScrolledToEndNotifier$
      .pipe(
        debounceTime(400))
      .subscribe(async _ => {
        const currentUser = this.currentUserInfo$.getValue();
        if (!currentUser) throw new Error(ErrorMessageConstants.UserNotFound);
        const transactionsInfo = this.currentUserTransactionsInfo$.getValue();
        const lastTransactionInTransactionsInfo = transactionsInfo[transactionsInfo.length - 1];
        if (!lastTransactionInTransactionsInfo) return;
        const getTransactionsByUserId$ = this._transactionsApiService.getTransactionsByUserId(currentUser.id, lastTransactionInTransactionsInfo.createdAt, 15, lastTransactionInTransactionsInfo.id);
        const transactions = await firstValueFrom(getTransactionsByUserId$);
        const currentUserTransactionsInfo = this.currentUserTransactionsInfo$.getValue();
        currentUserTransactionsInfo.push(...transactions.response);
        this.currentUserTransactionsInfo$.next(currentUserTransactionsInfo);
      });
  }

  //events
  protected async setUserStatus(user: IUserDto, status: UserStatus) {
    if (user.userStatus === status || this.changingStatus().has(user.id)) return;
    this.changingStatus.update(ids => new Set(ids).add(user.id));
    try {
      const request = status === UserStatus.Suspended
        ? this._usersApiService.suspend(user.id)
        : this._usersApiService.notSuspend(user.id);
      await firstValueFrom(request);
      user.userStatus = status;
    } catch {
      this.notifications.add({severity: 'error', summary: 'Error', detail: 'Could not change the user status.'});
    } finally {
      this.changingStatus.update(ids => new Set([...ids].filter(id => id !== user.id)));
    }
  }

  public async onClickGetUserTransactionsInfoHandler(userId: string) {
    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.showUserInfoWindow = true;
    let user = this._usersStateService.users$.getValue().find(x => x.id === userId);
    if (!user) {
      user = this._usersStateService.searchedUsers$.getValue().find(x => x.id === userId);
    }
    if (!user) throw new Error(ErrorMessageConstants.UserNotFound);
    this.currentUserInfo$.next(user);
    this.currentUserTransactionsInfoLoader = true;
    const getTransactionsByUserId$ = this._transactionsApiService.getTransactionsByUserId(userId, new Date(Date.now()), 15);
    const getTransactionsByUserIdResult = await firstValueFrom(getTransactionsByUserId$);
    this.currentUserTransactionsInfo$.next(getTransactionsByUserIdResult.response);
    this.currentUserTransactionsInfoLoader = false;
  }

  public onScrollTransactionInfoHandler(e: Event) {
    const target = e.target as HTMLElement;
    if (target.offsetHeight + target.scrollTop >= target.scrollHeight - 1) {
      this.transactionListScrolledToEndNotifier$.next(undefined);
    }
  }

  //actions
  public closeUserTransactionsInfo() {
    this.showUserInfoWindow = false;
    this.currentUserInfo$.next(null);
    this.currentUserTransactionsInfo$.next([]);
    this.previousFocus?.focus();
    this.previousFocus = null;
  }

  public async rollbackTransaction(transactionId: string) {
    await firstValueFrom(this._transactionsApiService.rollBackTransaction(transactionId));
    this.currentUserTransactionsInfo$.next(this.currentUserTransactionsInfo$.value.map(transaction =>
      transaction.id === transactionId ? {...transaction, transactionState: TransactionState.RolledBack} : transaction));
  }

  //common
  public getTransactionClassName(userId: string, transaction: ITransactionDto) : string {
    if (transaction.transactionState === TransactionState.RolledBack) return "userInfoWindowBodyTransactionRolledBack";
    if (transaction.toUserId === userId) return 'userInfoWindowBodyTransactionToMe';

    return 'userInfoWindowBodyTransactionFromMe'
  }


}
