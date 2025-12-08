import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const supabaseService = inject(SupabaseService);
    const user = supabaseService.currentUserValue;

    // Clone the request and add authorization header if user is authenticated
    if (user) {
        const supabase = supabaseService.getClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.access_token) {
                req = req.clone({
                    setHeaders: {
                        Authorization: `Bearer ${session.access_token}`
                    }
                });
            }
        });
    }

    return next(req);
};
