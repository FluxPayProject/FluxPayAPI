import { SkeletonModule } from 'primeng/skeleton';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {animate, animateChild, query, stagger, style, transition, trigger} from "@angular/animations";
import {ContactsStateService} from "../../services/state/contacts-state.service";
import {ProfileStateService} from "../../services/state/profile-state.service";
import {
  BehaviorSubject, catchError, EMPTY, filter, Subscription, switchMap, timer
} from "rxjs";
import {TextService} from "../../services/common/text.service";
import {IContactDto} from "../../types/interfaces/consumer/IContactDto";
import {MessageService} from "primeng/api";
import {NavigationStart, Router} from "@angular/router";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, AngularSvgIconModule, SkeletonModule],
  selector: 'app-contacts-outlet',
  templateUrl: './contacts-outlet.component.html',
  styleUrls: ['./contacts-outlet.component.scss'],
  animations: [
    trigger('contactListAnimation', [
      transition(':enter', [
        query(':enter', style({ marginTop: -5, opacity: 0 }), { optional: true }),
        query(':enter', stagger('50ms', [
          animate('150ms', style({ marginTop: 0, opacity: 1 }))
        ]), { optional: true })
      ]),
      transition(":leave", [
          query("@contactAnimation", animateChild({duration: "0.25s"}), {optional: true}),
      ])
    ]),
    trigger("contactAnimation", [
      transition(':leave', [
          animate('0.25s ease', style({ height: 0, opacity: 0, padding: 0, margin: 0 })),
      ])
    ])
  ]
})
export class ContactsOutletComponent implements OnInit, OnDestroy{
  //observable
  public contacts$ = this._contactsStateService.contacts$;
  public searchedContacts$ = this._contactsStateService.searchedContacts$;

  public searchText$ = new BehaviorSubject<string>("");

  //subscriptions
  public routerSubscription: Subscription;

  //common
  public contactListAnimContinues = false;
  public searchedContactListAnimContinues = false;
  public isAnimationAllowed = true;

  constructor(
      protected _contactsStateService: ContactsStateService,
      protected _profileStateService: ProfileStateService,
      protected _textService: TextService,
      protected _router: Router,
      protected _changeDetectorRef: ChangeDetectorRef,
      private _messageService: MessageService
  ) {
    this.routerSubscription = this._router.events
        .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
        .subscribe(x => {
          this.isAnimationAllowed = false;
          this._changeDetectorRef.detectChanges();
        })
  }

  async ngOnInit() {
    if (!this._profileStateService.isAuthenticated) return;

    this.routerSubscription.add(this.searchText$.pipe(
      switchMap(text => {
        this._contactsStateService.clearSearchContacts();
        if (!text.trim()) return EMPTY;

        return timer(400).pipe(
          switchMap(() => this._contactsStateService.getSearchContactsAsync(text)),
          catchError(() => {
            this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not search contacts.'});
            return EMPTY;
          })
        );
      })
    ).subscribe());

    try {
      await this._contactsStateService.getContactsAsync();
    } catch {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not load contacts.'});
    }
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
    this._contactsStateService.clearSearchContacts();
  }

  //events
  async onClickAddContactHandler(contactId: string) {
    try {
      await this._contactsStateService.addContactAsync(contactId);
    } catch {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not add the contact.'});
    }
  }

  async onClickDeleteContactHandler(contactId: string) {
    try {
      await this._contactsStateService.deleteContactAsync(contactId);
    } catch {
      this._messageService.add({severity: 'error', summary: 'Error', detail: 'Could not remove the contact.'});
    }
  }

  //other
  identifyContactDto(index: number, item: IContactDto) {
    return item.contactId + item.userId;
  }

  setContactListAnimContinues = (v: boolean) => this.contactListAnimContinues = v;
  setSearchedContactListAnimContinues = (v: boolean) => this.searchedContactListAnimContinues = v;
}
