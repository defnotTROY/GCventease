import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { VerificationService } from '../../../../core/services/verification.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LucideAngularModule, User, Settings, Shield, Bell, Lock, LogOut, CheckCircle, AlertCircle, Clock, Upload, FileText, X, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  // User data
  user: any = null;
  loading = false;

  // Tabs
  activeTab = 'profile';

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

  // Verification
  verificationStatus: any = null;
  verificationFile: File | null = null;
  verificationPreview: string | null = null;
  isUploading = false;
  verificationType = 'identity';
  documentType = 'id_card';

  // Icons
  readonly UserIcon = User;
  readonly SettingsIcon = Settings;
  readonly ShieldIcon = Shield;
  readonly BellIcon = Bell;
  readonly LockIcon = Lock;
  readonly LogOutIcon = LogOut;
  readonly CheckCircleIcon = CheckCircle;
  readonly AlertCircleIcon = AlertCircle;
  readonly ClockIcon = Clock;
  readonly UploadIcon = Upload;
  readonly FileTextIcon = FileText;
  readonly XIcon = X;
  readonly Loader2Icon = Loader2;

  constructor(
    private router: Router,
    private authService: AuthService,
    private verificationService: VerificationService,
    private toast: ToastService
  ) { }

  async ngOnInit() {
    await this.loadUserData();
    await this.loadVerificationStatus();
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

      // Load prefs
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        this.preferences = JSON.parse(savedPrefs);
      }

    } catch (error: any) {
      console.error('Error loading user data:', error);
      this.toast.error('Failed to load user data');
    } finally {
      this.loading = false;
    }
  }

  async loadVerificationStatus() {
    if (!this.user) return;

    const { data } = await this.verificationService.getVerification(this.user.id);
    this.verificationStatus = data;
  }

  async updateProfile() {
    try {
      this.loading = true;

      const result = await this.authService.updateUserProfile({
        first_name: this.profileData.firstName,
        last_name: this.profileData.lastName,
        phone: this.profileData.phone
      });

      if (!result.success) throw new Error(result.error);

      this.toast.success('Profile updated successfully!');
      await this.loadUserData();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.toast.error(error.message || 'Failed to update profile');
    } finally {
      this.loading = false;
    }
  }

  async updatePassword() {
    try {
      this.loading = true;

      if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
        this.toast.error('Passwords do not match');
        return;
      }

      if (this.passwordData.newPassword.length < 6) {
        this.toast.error('Password must be at least 6 characters');
        return;
      }

      const { error } = await this.authService.updatePassword(this.passwordData.newPassword);

      if (error) throw error;

      this.toast.success('Password updated successfully!');
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };

    } catch (error: any) {
      console.error('Error updating password:', error);
      this.toast.error(error.message || 'Failed to update password');
    } finally {
      this.loading = false;
    }
  }

  savePreferences() {
    localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
    this.toast.success('Preferences saved successfully!');
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Verification Methods
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.toast.error('File size must be less than 10MB');
        return;
      }
      this.verificationFile = file;

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => this.verificationPreview = e.target.result;
        reader.readAsDataURL(file);
      } else {
        this.verificationPreview = null;
      }
    }
  }

  async submitVerification() {
    if (!this.verificationFile || !this.user) return;

    this.isUploading = true;
    try {
      const { error } = await this.verificationService.uploadVerification(
        this.user.id,
        this.verificationFile,
        {
          verificationType: this.verificationType,
          documentType: this.documentType
        }
      );

      if (error) throw error;

      this.toast.success('Verification document submitted successfully!');
      this.verificationFile = null;
      this.verificationPreview = null;
      await this.loadVerificationStatus();

    } catch (error: any) {
      console.error('Error submitting verification:', error);
      this.toast.error(error.message || 'Failed to submit verification');
    } finally {
      this.isUploading = false;
    }
  }

  async logout() {
    await this.authService.signOut();
  }
}
