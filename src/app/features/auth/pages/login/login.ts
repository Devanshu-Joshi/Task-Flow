import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { UserAuth } from '@core/services/user-auth/user-auth';
import { LoadingOverlay } from '@shared/components/loading-overlay/loading-overlay';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, LoadingOverlay],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  fb = inject(FormBuilder);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  showPassword = false;
  isLoading = signal<boolean>(false);

  constructor(
    private userAuth: UserAuth,
    private router: Router,
    private toastr: ToastrService
  ) { }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.shakeFirstInvalidControl();
      return;
    }
    this.isLoading.set(true);

    const { email, password } = this.loginForm.value;

    this.userAuth.login({ email: email!, password: password! })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.toastr.success('Login Successfully', 'Success');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 400) {
            this.toastr.error('Invalid email or password', 'Login failed');
          } else {
            this.toastr.error('Something went wrong', 'Error');
          }
          console.error('Login error:', err);
        }
      });
  }

  shakeFirstInvalidControl() {
    const firstInvalidControl = document.querySelector('form .ng-invalid') as HTMLElement;
    if (!firstInvalidControl) return;

    firstInvalidControl.classList.add('shake');
    setTimeout(() => firstInvalidControl.classList.remove('shake'), 400);
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}