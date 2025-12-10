import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
    forgotPasswordForm: FormGroup;
    isLoading = false;
    errorMessage = '';
    successMessage = '';

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.forgotPasswordForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    async onSubmit() {
        if (this.forgotPasswordForm.invalid) {
            this.forgotPasswordForm.get('email')?.markAsTouched();
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const { email } = this.forgotPasswordForm.value;
        const result = await this.authService.forgotPassword(email);

        this.isLoading = false;

        if (result.success) {
            this.successMessage = result.message || 'Password reset email sent!';
            this.forgotPasswordForm.reset();
            // Redirect to login after 3 seconds
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 3000);
        } else {
            this.errorMessage = result.error || 'Failed to send reset email. Please try again.';
        }
    }

    get email() {
        return this.forgotPasswordForm.get('email');
    }
}
