import { Component, OnInit, signal } from '@angular/core';
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

  constructor(
    protected _profileStateService: ProfileStateService,
    private _signalrService: SignalrService) { }

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
