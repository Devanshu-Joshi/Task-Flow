import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserAuth } from '@core/services/user-auth/user-auth';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { passwordStrengthValidator } from '@core/functions/passwordStrengthValidator';
import { CommonModule } from '@angular/common';
import { confirmPasswordValidator } from '@core/functions/confirmPasswordValidator';
import { LoadingOverlay } from '@shared/components/loading-overlay/loading-overlay';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterModule, CommonModule, LoadingOverlay],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {

  signupForm;

  isLoading = signal<boolean>(false);

  hasMinLength = false;
  hasLowercase = false;
  hasUppercase = false;
  hasNumber = false;
  hasSpecialChar = false;
  showPassword = false;
  showConfirmPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  constructor(private fb: FormBuilder, private authService: UserAuth, private router: Router, private toastr: ToastrService) {
    this.signupForm = this.fb.nonNullable.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      cpassword: ['', [Validators.required]]
    },
      {
        validators: confirmPasswordValidator('password', 'cpassword')
      });
    this.listenToPasswordChanges();
  }

  private validationMessages: Record<string, Record<string, string>> = {
    email: {
      required: 'Email is required',
      email: 'Please enter a valid email address',
    },
    password: {
      required: 'Password is required',
      minlength: 'Password must be at least 8 characters',
      uppercase: 'Password must contain at least one uppercase letter',
      specialChar: 'Password must contain at least one special character',
      number: 'Password must contain at least one number',
    },
    cpassword: {
      required: 'Confirm Password is required',
    }
  };

  private listenToPasswordChanges(): void {
    this.signupForm.get('password')!.valueChanges.subscribe(password => {
      const value = password ?? '';
      this.updatePasswordChecks(value);
    });
  }

  private updatePasswordChecks(password: string): void {
    this.hasMinLength = password.length >= 8;
    this.hasLowercase = /[a-z]/.test(password);
    this.hasUppercase = /[A-Z]/.test(password);
    this.hasNumber = /\d/.test(password);
    this.hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  }

  submit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.shakeFirstInvalidControl();
      return;
    }

    this.isLoading.set(true);

    const { username: name, email, password } = this.signupForm.getRawValue();

    this.authService
      .register({ name, email, password, parentId: -1 })
      .subscribe({
        next: message => {
          this.isLoading.set(false);
          this.toastr.success(message || 'Registration successful', 'Success');
          this.router.navigate(['/login']);
        },
        error: err => {
          this.isLoading.set(false);
          this.toastr.error(err?.error || 'Registration Failed');
        }
      });
  }

  shakeFirstInvalidControl() {
    const firstInvalidControl: HTMLElement | null =
      document.querySelector('form .ng-invalid');

    if (!firstInvalidControl) return;

    firstInvalidControl.classList.add('shake');

    setTimeout(() => {
      firstInvalidControl.classList.remove('shake');
    }, 400);
  }

  get username() {
    return this.signupForm.get('username');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get cpassword() {
    return this.signupForm.get('cpassword');
  }

}

// private showValidationToast(): void {
//   for (const controlName of Object.keys(this.signupForm.controls)) {
//     const control = this.signupForm.get(controlName);

//     if (control && control.invalid && control.errors) {
//       const firstErrorKey = Object.keys(control.errors)[0];

//       const message =
//         this.validationMessages[controlName]?.[firstErrorKey] ??
//         'Invalid input';

//       this.toastr.error(message, 'Validation Error');

//       break;
//     }
//   }
// }