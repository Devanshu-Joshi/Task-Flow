import { Component, Input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { UserAuth } from '@core/services/user-auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  loginForm;
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toastr: ToastrService, private userAuth: UserAuth) {
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
      // this.showValidationToast();
      this.shakeFirstInvalidControl();
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      const response = await this.authService.login(email!, password!);
      console.log(response);
      this.router.navigate(['/dashboard']);
      this.toastr.success('Login successful', 'Success');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') this.toastr.error('Invalid credentials', 'Error');
      console.error("Error during login = ", error);
    }
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

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

}

//   private showValidationToast(): void {
//   for(const controlName of Object.keys(this.loginForm.controls)) {
//   const control = this.loginForm.get(controlName);

//   if (control && control.invalid && control.errors) {
//     const firstErrorKey = Object.keys(control.errors)[0];

//     const message =
//       this.validationMessages[controlName]?.[firstErrorKey] ??
//       'Invalid input';

//     this.toastr.error(message, 'Validation Error');

//     break;
//   }
// }
//   }