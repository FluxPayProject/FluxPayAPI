import { Component } from '@angular/core';
import {ProfileStateService} from "../../services/state/profile-state.service";
import {TextService} from "../../services/common/text.service";
import {map} from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  protected readonly profileName$ = this.profileState.user$.pipe(
    map(user => user ? this.textService.pullUsernameFromMail(user.email) : null)
  );

  constructor(
    private profileState: ProfileStateService,
    private textService: TextService) {}
}
