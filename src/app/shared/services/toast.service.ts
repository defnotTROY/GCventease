import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

    show(message: string, type: Toast['type'] = 'info', duration: number = 3000) {
        const id = this.generateId();
        const toast: Toast = { id, message, type, duration };

        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next([...currentToasts, toast]);

        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }
    }

    success(message: string, duration?: number) {
        this.show(message, 'success', duration);
    }

    error(message: string, duration?: number) {
        this.show(message, 'error', duration);
    }

    info(message: string, duration?: number) {
        this.show(message, 'info', duration);
    }

    warning(message: string, duration?: number) {
        this.show(message, 'warning', duration);
    }

    remove(id: string) {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
    }

    clear() {
        this.toastsSubject.next([]);
    }

    private generateId(): string {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
