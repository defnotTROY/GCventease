import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loading-spinner',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex items-center justify-center" [class.min-h-screen]="fullScreen">
      <div class="text-center">
        <div 
          class="animate-spin rounded-full border-b-2 border-primary-600 mx-auto"
          [ngClass]="{
            'h-8 w-8': size === 'sm',
            'h-12 w-12': size === 'md',
            'h-16 w-16': size === 'lg'
          }"
        ></div>
        <p *ngIf="text" class="mt-4 text-gray-600" [ngClass]="{
          'text-sm': size === 'sm',
          'text-base': size === 'md',
          'text-lg': size === 'lg'
        }">{{ text }}</p>
      </div>
    </div>
  `,
    styles: []
})
export class LoadingSpinnerComponent {
    fullScreen: boolean = false;
    size: 'sm' | 'md' | 'lg' = 'md';
    text: string = '';
}
