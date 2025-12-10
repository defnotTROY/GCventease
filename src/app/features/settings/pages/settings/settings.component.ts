import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  // User data
  user: any = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Profile form
  profileData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: ''
  };

  // Password form
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Preferences
  preferences = {
    emailNotifications: true,
    eventReminders: true,
    weeklyDigest: false,
    theme: 'light'
  };

  activeTab = 'profile';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    await this.loadUserData();
  }

  async loadUserData() {
    try {
      this.loading = true;
      this.user = await this.authService.getCurrentUser();

      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }

      // Populate profile data
      this.profileData = {
        firstName: this.user.user_metadata?.first_name || '',
        lastName: this.user.user_metadata?.last_name || '',
        email: this.user.email || '',
        phone: this.user.user_metadata?.phone || '',
        role: this.user.user_metadata?.role || 'User'
      };

    } catch (error: any) {
      console.error('Error loading user data:', error);
      this.error = 'Failed to load user data';
    } finally {
      this.loading = false;
    }
  }

  async updateProfile() {
    try {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      const result = await this.authService.updateUserProfile({
        first_name: this.profileData.firstName,
        last_name: this.profileData.lastName,
        phone: this.profileData.phone
      });

      if (!result.success) throw new Error(result.error);

      this.successMessage = 'Profile updated successfully!';
      setTimeout(() => this.successMessage = null, 3000);

      // Refresh user data
      await this.loadUserData();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.error = error.message || 'Failed to update profile';
    } finally {
      this.loading = false;
    }
  }

  async updatePassword() {
    try {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
        this.error = 'Passwords do not match';
        this.loading = false;
        return;
      }

      if (this.passwordData.newPassword.length < 6) {
        this.error = 'Password must be at least 6 characters';
        this.loading = false;
        return;
      }

      const { error } = await this.authService.updatePassword(this.passwordData.newPassword);

      if (error) throw error;

      this.successMessage = 'Password updated successfully!';
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      setTimeout(() => this.successMessage = null, 3000);

    } catch (error: any) {
      console.error('Error updating password:', error);
      this.error = error.message || 'Failed to update password';
    } finally {
      this.loading = false;
    }
  }

  savePreferences() {
    // Save preferences to local storage
    localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
    this.successMessage = 'Preferences saved successfully!';
    setTimeout(() => this.successMessage = null, 3000);
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
