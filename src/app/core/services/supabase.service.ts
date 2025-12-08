import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
    id: string;
    email: string;
    user_metadata?: {
        first_name?: string;
        last_name?: string;
        role?: string;
        phone?: string;
        organization?: string;
    };
    email_confirmed_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private currentUserSubject: BehaviorSubject<AuthUser | null>;
    public currentUser$: Observable<AuthUser | null>;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
        this.currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
        this.currentUser$ = this.currentUserSubject.asObservable();

        // Initialize auth state
        this.initializeAuth();
    }

    private async initializeAuth() {
        const { data: { session } } = await this.supabase.auth.getSession();
        if (session?.user) {
            this.currentUserSubject.next(session.user as AuthUser);
        }

        // Listen for auth changes
        this.supabase.auth.onAuthStateChange((_event, session) => {
            this.currentUserSubject.next(session?.user as AuthUser || null);
        });
    }

    // Authentication methods
    async signUp(email: string, password: string, metadata?: any) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        return { data, error };
    }

    async signIn(email: string, password: string) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    }

    async signOut() {
        const { error } = await this.supabase.auth.signOut();
        return { error };
    }

    async getCurrentUser(): Promise<{ user: AuthUser | null }> {
        const { data: { user } } = await this.supabase.auth.getUser();
        return { user: user as AuthUser | null };
    }

    async resetPasswordForEmail(email: string) {
        const { data, error } = await this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });
        return { data, error };
    }

    async updatePassword(newPassword: string) {
        const { data, error } = await this.supabase.auth.updateUser({
            password: newPassword
        });
        return { data, error };
    }

    async updateProfile(updates: any) {
        const { data, error } = await this.supabase.auth.updateUser({
            data: updates
        });
        return { data, error };
    }

    async resendVerificationEmail() {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user?.email) {
            return { error: { message: 'No user email found' } };
        }

        const { data, error } = await this.supabase.auth.resend({
            type: 'signup',
            email: user.email
        });
        return { data, error };
    }

    // Get current user value (synchronous)
    get currentUserValue(): AuthUser | null {
        return this.currentUserSubject.value;
    }

    // Database methods
    getClient(): SupabaseClient {
        return this.supabase;
    }
}
