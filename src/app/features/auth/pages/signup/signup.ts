import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { passwordStrengthValidator } from '../../../../core/functions/passwordStrengthValidator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {

  signupForm;

  hasMinLength = false;
  hasLowercase = false;
  hasUppercase = false;
  hasNumber = false;
  hasSpecialChar = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toastr: ToastrService) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      cpassword: ['', [Validators.required]]
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

  async submit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      this.showValidationToast();
      return;
    }

    const { email, password, cpassword } = this.signupForm.value;

    if (password !== cpassword) { // Check if passwords match
      this.toastr.error('Passwords do not match', 'Validation Error');
      return;
    }

    try {
      await this.authService.register(email!, password!);
      this.toastr.success('Registration successful', 'Success');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error(error);
    }
  }

  private showValidationToast(): void {
    for (const controlName of Object.keys(this.signupForm.controls)) {
      const control = this.signupForm.get(controlName);

      if (control && control.invalid && control.errors) {
        const firstErrorKey = Object.keys(control.errors)[0];

        const message =
          this.validationMessages[controlName]?.[firstErrorKey] ??
          'Invalid input';

        this.toastr.error(message, 'Validation Error');

        break;
      }
    }
  }

}
