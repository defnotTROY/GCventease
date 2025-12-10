import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FilterUsersPipe } from '../../../../shared/pipes/filter-users.pipe';
import { LucideAngularModule, Users, Search, Shield, UserCheck, UserX, Mail, Calendar, Loader2, RefreshCw, X, AlertTriangle } from 'lucide-angular';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, FilterUsersPipe],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  loading = true;
  isAdmin = false;
  users: any[] = [];
  filteredUsers: any[] = [];
  totalUsersCount = 0;
  currentUser: any = null;

  // Search & Filters
  searchQuery = '';
  roleFilter = 'all';
  statusFilter = 'all';

  // Action State
  actionLoading: string | null = null;
  selectedUserForAction: any = null;
  showResetPasswordModal = false;
  showStatusModal = false;

  // Icons
  readonly UsersIcon = Users;
  readonly SearchIcon = Search;
  readonly ShieldIcon = Shield;
  readonly UserCheckIcon = UserCheck;
  readonly UserXIcon = UserX;
  readonly MailIcon = Mail;
  readonly CalendarIcon = Calendar;
  readonly Loader2Icon = Loader2;
  readonly RefreshCwIcon = RefreshCw;
  readonly XIcon = X;
  readonly AlertTriangleIcon = AlertTriangle;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) { }

  async ngOnInit() {
    this.currentUser = await this.authService.getCurrentUser();
    const role = this.currentUser?.user_metadata?.role;
    this.isAdmin = role === 'admin' || role === 'Admin' || role === 'Administrator';

    if (!this.isAdmin) {
      this.loading = false;
      return;
    }

    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.loading = true;
      const [allUsers, totalCount] = await Promise.all([
        this.adminService.getAllUsers(),
        this.adminService.getTotalUsers()
      ]);

      // Mark current user as admin if needed (React logic copy)
      if (this.currentUser) {
        allUsers.forEach(u => {
          if (u.id === this.currentUser.id && this.isAdmin) {
            u.role = 'Administrator';
          }
        });
      }

      this.users = allUsers;
      this.totalUsersCount = Math.max(totalCount, allUsers.length); // Ensure at least list length
      this.applyFilters();
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    } finally {
      this.loading = false;
    }
  }

  applyFilters() {
    let filtered = this.users;

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        (u.first_name && u.first_name.toLowerCase().includes(q)) ||
        (u.last_name && u.last_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.organization && u.organization.toLowerCase().includes(q))
      );
    }

    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === this.statusFilter);
    }

    this.filteredUsers = filtered;
  }

  onFilterChange() {
    this.applyFilters();
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'Administrator': return 'bg-red-100 text-red-800';
      case 'Event Organizer': return 'bg-blue-100 text-blue-800';
      case 'Viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getNewUsersThisMonth(): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.users.filter(u => {
      if (!u.created_at) return false;
      return new Date(u.created_at) >= startOfMonth;
    }).length;
  }

  // Action Handlers
  openStatusModal(user: any) {
    const statusMap: any = {
      'active': 'inactive',
      'inactive': 'suspended',
      'suspended': 'active'
    };
    const newStatus = statusMap[user.status] || 'inactive';
    this.selectedUserForAction = { ...user, newStatus };
    this.showStatusModal = true;
  }

  async confirmUpdateStatus() {
    if (!this.selectedUserForAction) return;

    const { id: userId, newStatus } = this.selectedUserForAction;
    this.showStatusModal = false;
    this.actionLoading = userId;

    try {
      await this.adminService.updateUserStatus(userId, newStatus);
      this.toast.success(`User status updated to ${newStatus}`);
      await this.loadUsers();
    } catch (error: any) {
      this.toast.error(`Unable to update status: ${error.message || 'Error'}`);
    } finally {
      this.actionLoading = null;
      this.selectedUserForAction = null;
    }
  }

  openResetPasswordModal(user: any) {
    this.selectedUserForAction = user;
    this.showResetPasswordModal = true;
  }

  async confirmResetPassword() {
    if (!this.selectedUserForAction) return;

    const email = this.selectedUserForAction.email;
    this.showResetPasswordModal = false;

    try {
      const result = await this.authService.forgotPassword(email);
      if (!result.success) throw new Error(result.error);
      this.toast.success(`Reset email sent to ${email}`);
    } catch (error: any) {
      this.toast.error(`Failed to send reset email: ${error.message}`);
    } finally {
      this.selectedUserForAction = null;
    }
  }

  closeModals() {
    this.showResetPasswordModal = false;
    this.showStatusModal = false;
    this.selectedUserForAction = null;
  }
}
