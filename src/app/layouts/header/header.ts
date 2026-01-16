import { Component } from '@angular/core';
import { AuthService } from '@core/services/auth';
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

  constructor(public authService: AuthService) {
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout Failed', error);
    }

  }
}
