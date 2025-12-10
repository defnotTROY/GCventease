import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './reset-password.component.html',
    styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
    resetPasswordForm: FormGroup;
    isLoading = false;
    errorMessage = '';
    successMessage = '';
    showPassword = false;
    showConfirmPassword = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.resetPasswordForm = this.fb.group({
            password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit() {
        // Check if we have a valid reset token in the URL
        // Supabase automatically handles the token verification
    }

    // Custom validator for password strength
    passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
        const password = control.value;
        if (!password) return null;

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumeric = /[0-9]/.test(password);

        const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

        return !passwordValid ? { passwordStrength: true } : null;
    }

    // Custom validator for password match
    passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;

        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    async onSubmit() {
        if (this.resetPasswordForm.invalid) {
            this.markFormGroupTouched(this.resetPasswordForm);
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const { password } = this.resetPasswordForm.value;
        const result = await this.authService.updatePassword(password);

        this.isLoading = false;

        if (result.success) {
            this.successMessage = result.message || 'Password updated successfully!';
            this.resetPasswordForm.reset();
            // Redirect to login after 2 seconds
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 2000);
        } else {
            this.errorMessage = result.error || 'Failed to reset password. Please try again.';
        }
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPasswordVisibility() {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    get password() {
        return this.resetPasswordForm.get('password');
    }

    get confirmPassword() {
        return this.resetPasswordForm.get('confirmPassword');
    }
}
