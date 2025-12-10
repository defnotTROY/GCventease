import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService, AuthUser } from './supabase.service';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(
        private supabaseService: SupabaseService,
        private router: Router
    ) {
        // Subscribe to current user changes
        this.supabaseService.currentUser$.subscribe(user => {
            this.isAuthenticatedSubject.next(!!user);
        });
    }

    /**
     * Sign in with email/password or student number/password
     */
    async signIn(credentials: LoginCredentials) {
        try {
            let email = credentials.email;

            // Check if input looks like a student number (no @ symbol)
            if (!credentials.email.includes('@')) {
                // Treat as student number - generate Gordon College email
                email = `${credentials.email.toLowerCase()}@gordoncollege.edu.ph`;
                console.log('Student number detected, using email:', email);
            }

            const { data, error } = await this.supabaseService.signIn(
                email,
                credentials.password
            );

            if (error) {
                return { success: false, error: error.message };
            }

            if (data.user) {
                // Check if email is verified
                if (!data.user.email_confirmed_at) {
                    await this.supabaseService.signOut();
                    return {
                        success: false,
                        error: 'Please verify your email before logging in. Check your inbox for the verification link.'
                    };
                }

                // Navigate to dashboard
                this.router.navigate(['/dashboard']);
                return { success: true, user: data.user };
            }

            return { success: false, error: 'Login failed' };
        } catch (error: any) {
            return { success: false, error: error.message || 'An unexpected error occurred' };
        }
    }

    /**
     * Sign up new user
     */
    async signUp(signupData: SignupData) {
        try {
            // Validate Gordon College email
            if (!signupData.email.toLowerCase().endsWith('@gordoncollege.edu.ph')) {
                return {
                    success: false,
                    error: 'Please use your Gordon College email address (@gordoncollege.edu.ph)'
                };
            }

            const { data, error } = await this.supabaseService.signUp(
                signupData.email,
                signupData.password,
                {
                    first_name: signupData.firstName,
                    last_name: signupData.lastName,
                    phone: signupData.phone,
                    role: 'User' // Default role
                }
            );

            if (error) {
                return { success: false, error: error.message };
            }

            if (data.user) {
                return {
                    success: true,
                    message: 'Account created! Please check your email to verify your account.',
                    user: data.user
                };
            }

            return { success: false, error: 'Signup failed' };
        } catch (error: any) {
            return { success: false, error: error.message || 'An unexpected error occurred' };
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            const { error } = await this.supabaseService.signOut();
            if (error) {
                return { success: false, error: error.message };
            }

            this.router.navigate(['/landing']);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message || 'An unexpected error occurred' };
        }
    }

    /**
     * Request password reset email
     */
    async forgotPassword(email: string) {
        try {
            const { error } = await this.supabaseService.resetPasswordForEmail(email);
            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: true,
                message: 'Password reset email sent! Check your inbox.'
            };
        } catch (error: any) {
            return { success: false, error: error.message || 'An unexpected error occurred' };
        }
    }

    /**
     * Update password
     */
    async updatePassword(newPassword: string) {
        try {
            const { error } = await this.supabaseService.updatePassword(newPassword);
            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: true,
                message: 'Password updated successfully!'
            };
        } catch (error: any) {
            return { success: false, error: error.message || 'An unexpected error occurred' };
        }
    }

    /**
     * Update user profile metadata
     */
    async updateUserProfile(metadata: any) {
        try {
            const { error } = await this.supabaseService.updateUserMetadata(metadata);
            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: true,
                message: 'Profile updated successfully!'
            };
        } catch (error: any) {
            return { success: false, error: error.message || 'An unexpected error occurred' };
        }
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail() {
        try {
            const { error } = await this.supabaseService.resendVerificationEmail();
            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: true,
                message: 'Verification email sent! Check your inbox.'
            };
        } catch (error: any) {
            return { success: false, error: error.message || 'An unexpected error occurred' };
        }
    }

    /**
     * Get current user
     */
    async getCurrentUser(): Promise<AuthUser | null> {
        const { user } = await this.supabaseService.getCurrentUser();
        return user;
    }

    /**
     * Get current user value (synchronous)
     */
    get currentUser(): AuthUser | null {
        return this.supabaseService.currentUserValue;
    }

    /**
     * Check if user is authenticated
     */
    get isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    /**
     * Check if user has a specific role
     */
    hasRole(role: string): boolean {
        const user = this.currentUser;
        return user?.user_metadata?.role === role;
    }

    /**
     * Check if user is admin
     */
    get isAdmin(): boolean {
        return this.hasRole('Administrator') || this.hasRole('Admin');
    }
}
