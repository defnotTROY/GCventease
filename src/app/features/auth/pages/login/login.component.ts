import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    loginForm: FormGroup;
    isLoading = false;
    errorMessage = '';
    showPassword = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required]], // Accept both email and student number
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    async onSubmit() {
        if (this.loginForm.invalid) {
            this.markFormGroupTouched(this.loginForm);
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        const { email, password } = this.loginForm.value;
        const result = await this.authService.signIn({ email, password });

        this.isLoading = false;

        if (!result.success) {
            this.errorMessage = result.error || 'Login failed. Please try again.';
        }
        // Navigation is handled by AuthService on success
    }

    togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
    }

    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }
}
