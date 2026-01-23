import { Component } from '@angular/core';
import { UserAuth } from '@core/services/user-auth/user-auth';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

  isMobileMenuOpen = false;

  constructor(public authService: UserAuth) {
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout Failed', error);
    }

  }
}
