import { Component, ElementRef, ViewChild, input, model, output } from '@angular/core';

let nextListId = 0;

@Component({
  selector: 'app-combobox',
  templateUrl: './combobox.component.html',
  styleUrl: './combobox.component.scss',
})
export class ComboboxComponent {
  readonly value = model('');
  readonly options = input<readonly string[]>([]);
  readonly placeholder = input.required<string>();
  readonly inputId = input<string>();
  readonly optionSelected = output<string>();

  @ViewChild('field') private field!: ElementRef<HTMLInputElement>;
  protected readonly listId = 'combobox-options-' + nextListId++;
  protected open = false;
  protected activeIndex = -1;

  protected update(value: string) {
    this.value.set(value);
    this.activeIndex = -1;
    this.open = true;
  }

  protected toggle() {
    this.field.nativeElement.focus();
    this.open = !this.open;
    this.activeIndex = -1;
  }

  protected close() {
    this.open = false;
    this.activeIndex = -1;
  }

  protected select(option: string) {
    this.value.set(option);
    this.optionSelected.emit(option);
    this.close();
  }

  protected onKeydown(event: KeyboardEvent) {
    const options = this.options();
    if (event.key === 'Escape' && this.open) {
      event.stopPropagation();
      this.close();
    } else if (event.key === 'Enter' && this.open && options[this.activeIndex] !== undefined) {
      event.preventDefault();
      this.select(options[this.activeIndex]);
    } else if (options.length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      this.open = true;
      const nextIndex = this.activeIndex + (event.key === 'ArrowDown' ? 1 : -1);
      this.activeIndex = nextIndex < 0 ? options.length - 1 : nextIndex % options.length;
      this.field.nativeElement.ownerDocument.getElementById(this.listId + '-' + this.activeIndex)
        ?.scrollIntoView({block: 'nearest'});
    }
  }
}
