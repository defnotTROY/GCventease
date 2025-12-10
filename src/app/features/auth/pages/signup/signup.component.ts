import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
    selector: 'app-signup',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.css']
})
export class SignupComponent {
    signupForm: FormGroup;
    isLoading = false;
    errorMessage = '';
    successMessage = '';
    showPassword = false;
    showConfirmPassword = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.signupForm = this.fb.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email, this.gordonEmailValidator]],
            phone: ['', [Validators.pattern(/^[0-9]{10,11}$/)]],
            password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    // Custom validator for Gordon College email
    gordonEmailValidator(control: AbstractControl): ValidationErrors | null {
        const email = control.value?.toLowerCase();
        if (email && !email.endsWith('@gordoncollege.edu.ph')) {
            return { gordonEmail: true };
        }
        return null;
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
        if (this.signupForm.invalid) {
            this.markFormGroupTouched(this.signupForm);
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const { firstName, lastName, email, phone, password } = this.signupForm.value;
        const result = await this.authService.signUp({
            firstName,
            lastName,
            email,
            phone,
            password
        });

        this.isLoading = false;

        if (result.success) {
            this.successMessage = result.message || 'Account created successfully!';
            this.signupForm.reset();
            // Redirect to login after 3 seconds
            setTimeout(() => {
                this.router.navigate(['/login']);
            }, 3000);
        } else {
            this.errorMessage = result.error || 'Signup failed. Please try again.';
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

    get firstName() {
        return this.signupForm.get('firstName');
    }

    get lastName() {
        return this.signupForm.get('lastName');
    }

    get email() {
        return this.signupForm.get('email');
    }

    get phone() {
        return this.signupForm.get('phone');
    }

    get password() {
        return this.signupForm.get('password');
    }

    get confirmPassword() {
        return this.signupForm.get('confirmPassword');
    }
}
