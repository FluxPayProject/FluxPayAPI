import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { BehaviorSubject, catchError, EMPTY, finalize, Subscription, switchMap, timer } from 'rxjs';
import { AvatarComponent } from '../avatar/avatar.component';
import { NotificationService } from '../../services/common/notification.service';
import { TextService } from '../../services/common/text.service';
import { ContactsStateService } from '../../services/state/contacts-state.service';
import { ProfileStateService } from '../../services/state/profile-state.service';
import { IContactDto } from '../../types/interfaces/consumer/IContactDto';

@Component({
  selector: 'app-contacts-outlet',
  imports: [AsyncPipe, NgTemplateOutlet, FormsModule, AngularSvgIconModule, AvatarComponent],
  templateUrl: './contacts-outlet.component.html',
  styleUrl: './contacts-outlet.component.scss',
})
export class ContactsOutletComponent implements OnInit, OnDestroy {
  protected readonly contacts$ = this.contactsState.contacts$;
  protected readonly searchedContacts$ = this.contactsState.searchedContacts$;
  protected readonly searchText$ = new BehaviorSubject('');
  protected readonly loadingContacts = signal(true);
  protected readonly searching = signal(false);
  protected readonly searchFailed = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly removalId = signal<string | null>(null);
  protected readonly removing = signal(false);
  private searchSubscription?: Subscription;

  constructor(
    private contactsState: ContactsStateService,
    private profileState: ProfileStateService,
    protected textService: TextService,
    private notifications: NotificationService,
  ) {}

  async ngOnInit() {
    if (!this.profileState.isAuthenticated) return;

    this.searchSubscription = this.searchText$.pipe(
      switchMap(value => {
        const query = value.trim();
        this.contactsState.clearSearchContacts();
        this.searchFailed.set(false);
        this.searching.set(!!query);
        if (!query) return EMPTY;

        return timer(400).pipe(
          switchMap(() => this.contactsState.getSearchContactsAsync(query)),
          catchError(() => {
            this.searchFailed.set(true);
            return EMPTY;
          }),
          finalize(() => this.searching.set(false)),
        );
      })
    ).subscribe();

    try {
      await this.contactsState.getContactsAsync();
    } catch {
      this.loadFailed.set(true);
    } finally {
      this.loadingContacts.set(false);
    }
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
    this.contactsState.clearSearchContacts();
  }

  protected filterSaved(contacts: IContactDto[], query: string) {
    const search = query.toLowerCase();
    return contacts.filter(contact => contact.contact.email.toLowerCase().includes(search) ||
      contact.contactId.toLowerCase().includes(search));
  }

  protected excludeSaved(results: IContactDto[], contacts: IContactDto[]) {
    const ids = new Set(contacts.map(contact => contact.contactId));
    return results.filter(contact => !ids.has(contact.contactId));
  }

  protected async addContact(contactId: string) {
    try {
      await this.contactsState.addContactAsync(contactId);
    } catch {
      this.notifications.add({severity: 'error', summary: 'Error', detail: 'Could not add the contact.'});
    }
  }

  protected async removeContact(contactId: string) {
    if (this.removing()) return;

    this.removing.set(true);
    try {
      await this.contactsState.deleteContactAsync(contactId);
      this.removalId.set(null);
    } catch {
      this.notifications.add({severity: 'error', summary: 'Error', detail: 'Could not remove the contact.'});
    } finally {
      this.removing.set(false);
    }
  }
}
