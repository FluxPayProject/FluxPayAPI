import {Directive, HostListener, Input} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appCopyText]',
  host: {
    'role': 'button',
    'tabindex': '0',
    '[attr.aria-label]': 'copyLabel + " " + appCopyText',
  }
})
export class CopyTextDirective {
  @Input() appCopyText: string = '';
  @Input() copyLabel = 'Copy ID';

  @HostListener('click') onClick() {
    void this.copyToClipboard();
  }

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeyDown(event: Event) {
    event.preventDefault();
    if (event instanceof KeyboardEvent && !event.repeat) void this.copyToClipboard();
  }

  private async copyToClipboard() {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(this.appCopyText);
        return;
      } catch {
        // Use the selection-based fallback when clipboard writes are unavailable.
      }
    }

    const focused = document.activeElement;
    const textarea = document.createElement('textarea');
    textarea.value = this.appCopyText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } finally {
      textarea.remove();
      if (focused instanceof HTMLElement) focused.focus({preventScroll: true});
    }
  }
}
