import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { VerificationService, Verification } from '../../../../core/services/verification.service';
import { StorageService } from '../../../../core/services/storage.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LucideAngularModule, Shield, CheckCircle, XCircle, Clock, FileText, Eye, Loader2, RefreshCw, Search, Filter, Download, AlertCircle } from 'lucide-angular';
import { SafeUrl } from '@angular/platform-browser';

@Component({
    selector: 'app-admin-verification-review',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
    templateUrl: './admin-verification-review.component.html',
    styleUrl: './admin-verification-review.component.css'
})
export class AdminVerificationReviewComponent implements OnInit {
    loading = true;
    isAdmin = false;
    user: any = null;

    verifications: Verification[] = [];
    filteredVerifications: Verification[] = [];

    selectedVerification: Verification | null = null;
    reviewModalOpen = false;
    reviewData = {
        action: '',
        rejectionReason: '',
        adminNotes: ''
    };

    documentUrl: string | null = null;
    loadingDocument = false;
    processing = false;

    // filters
    searchQuery = '';
    statusFilter = 'pending';

    // Icons
    readonly ShieldIcon = Shield;
    readonly CheckCircleIcon = CheckCircle;
    readonly XCircleIcon = XCircle;
    readonly ClockIcon = Clock;
    readonly FileTextIcon = FileText;
    readonly EyeIcon = Eye;
    readonly Loader2Icon = Loader2;
    readonly RefreshCwIcon = RefreshCw;
    readonly SearchIcon = Search;
    readonly FilterIcon = Filter;
    readonly DownloadIcon = Download;
    readonly AlertCircleIcon = AlertCircle;

    constructor(
        private verificationService: VerificationService,
        private storageService: StorageService,
        private authService: AuthService,
        private toast: ToastService,
        private router: Router
    ) { }

    async ngOnInit() {
        this.user = await this.authService.getCurrentUser();
        const role = this.user?.user_metadata?.role;
        this.isAdmin = role === 'admin' || role === 'Admin' || role === 'Administrator';

        if (!this.isAdmin) {
            this.loading = false;
            return;
        }

        await this.loadVerifications();
    }

    async loadVerifications() {
        try {
            this.loading = true;
            const { data, error } = await this.verificationService.getPendingVerifications({
                status: this.statusFilter === 'all' ? 'all' : this.statusFilter,
                limit: 100
            });

            if (error) throw error;
            this.verifications = data || [];
            this.applyFilters();
        } catch (error) {
            console.error('Error loading verifications:', error);
            this.verifications = [];
        } finally {
            this.loading = false;
        }
    }

    applyFilters() {
        let filtered = this.verifications;

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(v => {
                const email = v.metadata?.user_email?.toLowerCase() || '';
                const name = v.metadata?.user_name?.toLowerCase() || '';
                const type = v.verification_type?.toLowerCase() || '';
                const docType = v.document_type?.toLowerCase() || '';

                return email.includes(q) || name.includes(q) || type.includes(q) || docType.includes(q);
            });
        }

        this.filteredVerifications = filtered;
    }

    onFilterChange() {
        // Re-fetch if status changes to ensure we get data from server (since fetch depends on status)
        // But search is local.
        // Actually `loadVerifications` uses `statusFilter`.
        // So if status changes, we should call loadVerifications, otherwise just applyFilters.
    }

    onStatusFilterChange() {
        this.loadVerifications();
    }

    onSearch() {
        this.applyFilters();
    }

    async handleViewVerification(verification: Verification) {
        this.selectedVerification = verification;
        this.reviewModalOpen = true;
        this.loadingDocument = true;
        this.documentUrl = null;
        this.reviewData = { action: '', rejectionReason: '', adminNotes: '' };

        try {
            const { data: url, error } = await this.storageService.getVerificationDocumentUrl(
                verification.file_path,
                3600
            );
            if (error) throw error;
            this.documentUrl = url;
        } catch (error) {
            console.error('Error loading document', error);
            this.toast.error('Unable to load document');
        } finally {
            this.loadingDocument = false;
        }
    }

    async handleReview() {
        if (!this.selectedVerification || !this.reviewData.action || !this.user) {
            this.toast.warning('Please select an action');
            return;
        }

        if (this.reviewData.action === 'reject' && !this.reviewData.rejectionReason.trim()) {
            this.toast.warning('Please provide a rejection reason');
            return;
        }

        this.processing = true;
        try {
            if (this.reviewData.action === 'approve') {
                const { error } = await this.verificationService.approveVerification(
                    this.selectedVerification.id,
                    this.user.id,
                    this.reviewData.adminNotes || null
                );
                if (error) throw error;
            } else {
                const { error } = await this.verificationService.rejectVerification(
                    this.selectedVerification.id,
                    this.user.id,
                    this.reviewData.rejectionReason,
                    this.reviewData.adminNotes || null
                );
                if (error) throw error;
            }

            await this.loadVerifications();
            this.closeModal();
            this.toast.success(`Verification ${this.reviewData.action}ed successfully`);

        } catch (error: any) {
            console.error('Error reviewing:', error);
            this.toast.error(`Failed to ${this.reviewData.action} verification`);
        } finally {
            this.processing = false;
        }
    }

    closeModal() {
        this.reviewModalOpen = false;
        this.selectedVerification = null;
        this.documentUrl = null;
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'under_review': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Helpers for template access
    getUserEmail(v: Verification): string { return v.metadata?.user_email || 'N/A'; }
    getUserName(v: Verification): string { return v.metadata?.user_name || 'N/A'; }
}
