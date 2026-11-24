import { afterNextRender, Component, ElementRef, HostListener, inject, Injector, OnInit, signal, viewChild } from '@angular/core';
import { ProfileStateService } from '../../services/state/profile-state.service';
import {SignalrService} from "../../services/common/signalr.service";

@Component({
  standalone: false,
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {
  protected readonly authenticationUnavailable = signal(false);

  protected readonly navigationOpen = signal(false);
  private readonly navigationToggle = viewChild<ElementRef<HTMLButtonElement>>('navigationToggle');
  private readonly navigationClose = viewChild<ElementRef<HTMLButtonElement>>('navigationClose');
  private readonly injector = inject(Injector);
  private navigationSwipeStart?: Touch;

  constructor(
    protected _profileStateService: ProfileStateService,
    private _signalrService: SignalrService) { }

  protected openNavigation() {
    this.navigationOpen.set(true);
    afterNextRender(() => {
      if (this.navigationOpen()) this.navigationClose()?.nativeElement.focus();
    }, { injector: this.injector });
  }

  protected closeNavigation() {
    if (!this.navigationOpen()) return;
    this.navigationOpen.set(false);
    afterNextRender(() => {
      if (!this.navigationOpen()) this.navigationToggle()?.nativeElement.focus();
    }, { injector: this.injector });
  }

  protected onNavigationClick(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest('a[href]')) this.closeNavigation();
  }

  protected onNavigationEscape(event: Event) {
    if (event.target instanceof Element && event.target.closest('dialog[open]')) return;
    this.closeNavigation();
  }

  protected startNavigationSwipe(event: TouchEvent) {
    const touch = event.touches[0];
    this.navigationSwipeStart =
      !this.navigationOpen() && event.touches.length === 1 && touch.clientX <= 24 &&
      window.matchMedia('(max-width: 760px)').matches ? touch : undefined;
  }

  protected endNavigationSwipe(event: TouchEvent) {
    const start = this.navigationSwipeStart;
    this.cancelNavigationSwipe();
    const end = event.changedTouches[0];
    if (!start || !end || start.identifier !== end.identifier || event.touches.length) return;

    const horizontal = end.clientX - start.clientX;
    const vertical = Math.abs(end.clientY - start.clientY);
    if (horizontal >= 64 && horizontal > 2 * vertical) this.openNavigation();
  }

  protected cancelNavigationSwipe() {
    this.navigationSwipeStart = undefined;
  }

  @HostListener('window:resize')
  protected onViewportResize() {
    this.cancelNavigationSwipe();
    if (this.navigationOpen() && !window.matchMedia('(max-width: 760px)').matches) {
      this.navigationOpen.set(false);
    }
  }

  public async ngOnInit() {
    await this.checkAuthentication();
  }

  protected async checkAuthentication() {
    this.authenticationUnavailable.set(false);
    const result = await this._profileStateService.getAuthenticationAsync().catch(() => {
      this.authenticationUnavailable.set(true);
      return null;
    });

    if (result?.authenticated) {
      await this._profileStateService.getProfileAsync();

      await this._signalrService.build();
      this._signalrService.configure();
      await this._signalrService.start();
    }
  }
}
