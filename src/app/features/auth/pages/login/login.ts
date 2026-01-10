import { Component, Input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { passwordStrengthValidator } from '../../../../core/functions/passwordStrengthValidator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toastr: ToastrService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  private validationMessages: Record<string, Record<string, string>> = {
    email: {
      required: 'Email is required',
      email: 'Please enter a valid email address',
    },
    password: {
      required: 'Password is required'
    },
  };

  async submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.showValidationToast();
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email!, password!);
      this.router.navigate(['/dashboard']);
      this.toastr.success('Login successful', 'Success');
    } catch (error) {
      console.error(error);
      this.toastr.error('Login failed', 'Error');
    }
  }

  private showValidationToast(): void {
    for (const controlName of Object.keys(this.loginForm.controls)) {
      const control = this.loginForm.get(controlName);

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
