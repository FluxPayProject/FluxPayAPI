import { Component, computed, input } from '@angular/core';

const avatarPalette = [
  {background: '#dbeafe', foreground: '#1e3a8a'},
  {background: '#d1fae5', foreground: '#064e3b'},
  {background: '#fef3c7', foreground: '#78350f'},
  {background: '#fce7f3', foreground: '#831843'},
  {background: '#e0e7ff', foreground: '#312e81'},
  {background: '#cffafe', foreground: '#164e63'},
];

@Component({
  selector: 'app-avatar',
  template: '{{ avatar().initials }}',
  host: {
    'aria-hidden': 'true',
    '[style.background-color]': 'avatar().background',
    '[style.color]': 'avatar().foreground',
  },
  styles: ':host { display: inline-grid; place-items: center; border-radius: 50%; font-weight: 700; }',
})
export class AvatarComponent {
  readonly name = input.required<string>();

  protected readonly avatar = computed(() => {
    const name = this.name().normalize();
    const parts = name.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*/gu) ?? [];
    const initials = parts.slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();
    const shade = Array.from(name.toLowerCase()).reduce(
      (index, character) => (index * 31 + character.codePointAt(0)!) % avatarPalette.length, 0);

    return {initials: initials || '?', ...avatarPalette[shade]};
  });
}
