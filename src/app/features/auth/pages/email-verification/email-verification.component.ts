import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';

@Component({
    selector: 'app-email-verification',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './email-verification.component.html',
    styles: []
})
export class EmailVerificationComponent implements OnInit, OnDestroy {
    isVerifying = false;
    isVerified = false;
    email = '';
    isResending = false;
    isCheckingStatus = false;
    lastChecked: Date | null = null;
    errorMessage = ''; // Added for error display

    private pollingInterval: any;

    constructor(
        private authService: AuthService,
        private supabaseService: SupabaseService,
        private router: Router,
        private route: ActivatedRoute,
        private ngZone: NgZone
    ) { }

    async ngOnInit() {
        // Get email from query params if available
        this.route.queryParams.subscribe(params => {
            if (params['email']) {
                this.email = params['email'];
            }
        });

        // Check for verification tokens in URL (Supabase flow)
        // Actually Supabase handles this automatically on initial load if we use their client correctly
        // But we might need to capture state from the URL hash.

        // Check if user is already logged in
        const { user } = await this.supabaseService.getCurrentUser();
        if (user) {
            if (this.email === '') {
                this.email = user.email || '';
            }

            if (user.email_confirmed_at) {
                this.isVerified = true;
            } else {
                // Not verified yet, start polling
                this.startPolling();
            }
        } else {
            // If not logged in, maybe we just came from signup?
            // We can't really poll if we don't have a session, unless we rely on the user clicking the link
        }
    }

    ngOnDestroy() {
        this.stopPolling();
    }

    startPolling() {
        if (this.pollingInterval) return;
        this.pollingInterval = setInterval(() => {
            this.checkVerificationStatus(false);
        }, 5000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async checkVerificationStatus(manual: boolean = true) {
        if (!this.email) return; // Can't check without context

        if (manual) this.isCheckingStatus = true;

        try {
            // Refresh session to see if status updated
            const { data } = await this.supabaseService.client.auth.refreshSession();

            if (data.session?.user?.email_confirmed_at) {
                this.isVerified = true;
                this.stopPolling();
                // Redirect to login after success
                setTimeout(() => {
                    this.ngZone.run(() => this.router.navigate(['/login'], { queryParams: { verified: 'success' } }));
                }, 3000);
            } else {
                this.lastChecked = new Date();
                if (manual) {
                    // Show toast or message?
                    // For now just update last checked
                }
            }
        } catch (e) {
            console.error('Error checking status', e);
        } finally {
            if (manual) this.isCheckingStatus = false;
        }
    }

    async handleResendEmail() {
        if (!this.email) return;

        this.isResending = true;
        try {
            const { error } = await this.supabaseService.client.auth.resend({
                type: 'signup',
                email: this.email
            });

            if (error) {
                this.errorMessage = error.message;
            } else {
                // Success toast?
                alert('Verification email sent!');
            }
        } catch (e: any) {
            this.errorMessage = e.message || 'Failed to resend email';
        } finally {
            this.isResending = false;
        }
    }
}
