import {animate, style, transition, trigger} from '@angular/animations';

const hidden = style({transform: 'translateY(10px)', opacity: 0});
const visible = style({transform: 'translateY(0px)', opacity: 1});

export const rightBarAnimation = trigger('rightBarAnimation', [
  transition(':enter', [hidden, animate('.25s', visible)])
]);

export function listLoaderAnimation(name: string) {
  return trigger(name, [
    transition(':enter', [hidden, animate('.25s', visible)]),
    transition(':leave', [visible, animate('.25s', hidden)])
  ]);
}
