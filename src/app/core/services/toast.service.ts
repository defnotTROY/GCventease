import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts = new BehaviorSubject<Toast[]>([]);
    toasts$ = this.toasts.asObservable();

    show(type: Toast['type'], title: string, message: string, duration: number = 4000): void {
        const id = Math.random().toString(36).substring(2, 9);
        const toast: Toast = { id, type, title, message, duration };

        const currentToasts = this.toasts.getValue();
        this.toasts.next([...currentToasts, toast]);

        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }
    }

    success(title: string, message: string = '', duration?: number): void {
        this.show('success', title, message, duration);
    }

    error(title: string, message: string = '', duration?: number): void {
        this.show('error', title, message, duration);
    }

    warning(title: string, message: string = '', duration?: number): void {
        this.show('warning', title, message, duration);
    }

    info(title: string, message: string = '', duration?: number): void {
        this.show('info', title, message, duration);
    }

    dismiss(id: string): void {
        const currentToasts = this.toasts.getValue();
        this.toasts.next(currentToasts.filter(t => t.id !== id));
    }

    dismissAll(): void {
        this.toasts.next([]);
    }
}
