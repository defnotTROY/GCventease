import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Verification {
    id: string;
    user_id: string;
    verification_type: string;
    document_type: string;
    document_name: string;
    file_path: string;
    file_url: string;
    status: 'pending' | 'under_review' | 'approved' | 'rejected';
    reviewed_by?: string;
    reviewed_at?: string;
    rejection_reason?: string;
    admin_notes?: string;
    created_at: string;
    metadata?: any;
}

@Injectable({
    providedIn: 'root'
})
export class VerificationService {
    constructor(private supabase: SupabaseService) { }

    /**
     * Get user's verification status
     */
    async getVerification(userId: string): Promise<{ data: Verification | null; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('user_verifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
            return { data: data || null, error: null };
        } catch (error) {
            console.error('Error fetching verification:', error);
            return { data: null, error };
        }
    }

    /**
     * Check if user is verified
     */
    async isVerified(userId: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase.client.rpc('is_user_verified', {
                user_uuid: userId
            });

            if (error) throw error;
            return data || false;
        } catch (error) {
            console.error('Error checking verification status:', error);
            // Fallback to direct query
            const { data } = await this.getVerification(userId);
            return data?.status === 'approved' && (!data.metadata?.expires_at || new Date(data.metadata.expires_at) > new Date());
        }
    }

    /**
     * Upload verification document
     */
    async uploadVerification(userId: string, file: File, verificationData: any): Promise<{ data: Verification | null; error: any }> {
        try {
            // Validate file
            if (!file) {
                throw new Error('No file provided');
            }

            // Check file size (max 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error('File size exceeds 10MB limit');
            }

            // Check file type
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif'
            ];

            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Please upload PDF or image file.');
            }

            // Get current user info
            const currentUser = await this.supabase.getCurrentUser();
            const userEmail = currentUser?.email || null;
            const userName = currentUser?.user_metadata?.first_name && currentUser?.user_metadata?.last_name
                ? `${currentUser.user_metadata.first_name} ${currentUser.user_metadata.last_name}`
                : null;

            // Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `verifications/${userId}/${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await this.supabase.client.storage
                .from('verification-documents')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = this.supabase.client.storage
                .from('verification-documents')
                .getPublicUrl(fileName);

            // Check if user already has a verification
            const { data: existing } = await this.getVerification(userId);

            const verificationDataToInsert = {
                user_id: userId,
                verification_type: verificationData.verificationType || 'identity',
                document_type: verificationData.documentType || 'id_card',
                document_name: file.name,
                file_path: uploadData.path,
                file_url: publicUrl,
                file_size: file.size,
                mime_type: file.type,
                status: 'pending' as const,
                metadata: {
                    uploaded_at: new Date().toISOString(),
                    user_email: userEmail,
                    user_name: userName,
                    ...verificationData.metadata
                }
            };

            let result;
            if (existing) {
                // Update existing verification
                const { data, error } = await this.supabase.client
                    .from('user_verifications')
                    .update({
                        ...verificationDataToInsert,
                        reviewed_by: null,
                        reviewed_at: null,
                        rejection_reason: null
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // Create new verification
                const { data, error } = await this.supabase.client
                    .from('user_verifications')
                    .insert([verificationDataToInsert])
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }

            return { data: result, error: null };
        } catch (error) {
            console.error('Error uploading verification:', error);
            return { data: null, error };
        }
    }

    /**
     * Get all pending verifications (for admin review)
     */
    async getPendingVerifications(options: any = {}): Promise<{ data: Verification[]; error: any }> {
        try {
            const { limit = 50, offset = 0, status = 'pending' } = options;

            let query = this.supabase.client
                .from('user_verifications')
                .select('*')
                .in('status', status === 'all' ? ['pending', 'under_review'] : [status])
                .order('created_at', { ascending: false });

            if (limit) {
                query = query.limit(limit);
            }

            if (offset) {
                query = query.range(offset, offset + limit - 1);
            }

            const { data, error } = await query;

            if (error) throw error;

            return { data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching pending verifications:', error);
            return { data: [], error };
        }
    }

    /**
     * Approve verification (admin only)
     */
    async approveVerification(verificationId: string, adminId: string, notes: string | null = null): Promise<{ data: Verification | null; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('user_verifications')
                .update({
                    status: 'approved',
                    reviewed_by: adminId,
                    reviewed_at: new Date().toISOString(),
                    admin_notes: notes
                })
                .eq('id', verificationId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error approving verification:', error);
            return { data: null, error };
        }
    }

    /**
     * Reject verification (admin only)
     */
    async rejectVerification(verificationId: string, adminId: string, reason: string, notes: string | null = null): Promise<{ data: Verification | null; error: any }> {
        try {
            const { data, error } = await this.supabase.client
                .from('user_verifications')
                .update({
                    status: 'rejected',
                    reviewed_by: adminId,
                    reviewed_at: new Date().toISOString(),
                    rejection_reason: reason,
                    admin_notes: notes
                })
                .eq('id', verificationId)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error rejecting verification:', error);
            return { data: null, error };
        }
    }

    /**
     * Delete verification document
     */
    async deleteVerification(verificationId: string, userId: string): Promise<{ data: boolean | null; error: any }> {
        try {
            // Get verification to check ownership and get file path
            const { data: verification, error: fetchError } = await this.supabase.client
                .from('user_verifications')
                .select('*')
                .eq('id', verificationId)
                .eq('user_id', userId)
                .single();

            if (fetchError) throw fetchError;

            // Only allow deletion if status is pending or rejected
            if (!['pending', 'rejected'].includes(verification.status)) {
                throw new Error('Cannot delete approved or under review verification');
            }

            // Delete file from storage
            if (verification.file_path) {
                await this.supabase.client.storage
                    .from('verification-documents')
                    .remove([verification.file_path]);
            }

            // Delete verification from database
            const { error } = await this.supabase.client
                .from('user_verifications')
                .delete()
                .eq('id', verificationId);

            if (error) throw error;
            return { data: true, error: null };
        } catch (error) {
            console.error('Error deleting verification:', error);
            return { data: null, error };
        }
    }
}
