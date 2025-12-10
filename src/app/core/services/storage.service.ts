import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class StorageService {

    constructor(private supabase: SupabaseService) { }

    async uploadEventImage(file: File, userId: string, eventId: string | null = null) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${eventId || 'temp'}/${Date.now()}.${fileExt}`;

            const { data, error } = await this.supabase.client.storage
                .from('events')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = this.supabase.client.storage
                .from('events')
                .getPublicUrl(fileName);

            return {
                data: {
                    path: data.path,
                    publicUrl
                },
                error: null
            };
        } catch (error) {
            console.error('Error uploading image:', error);
            return { data: null, error };
        }
    }

    async deleteEventImage(imagePath: string) {
        try {
            const { error } = await this.supabase.client.storage
                .from('events')
                .remove([imagePath]);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting image:', error);
            return { error };
        }
    }

    getImageUrl(imagePath: string) {
        if (!imagePath) return null;

        const { data: { publicUrl } } = this.supabase.client.storage
            .from('events')
            .getPublicUrl(imagePath);

        return publicUrl;
    }

    async uploadVerificationDocument(file: File, userId: string) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `verifications/${userId}/${Date.now()}.${fileExt}`;

            const { data, error } = await this.supabase.client.storage
                .from('events')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = this.supabase.client.storage
                .from('events')
                .getPublicUrl(fileName);

            return {
                data: {
                    path: data.path,
                    publicUrl
                },
                error: null
            };
        } catch (error) {
            console.error('Error uploading verification document:', error);
            return { data: null, error };
        }
    }

    async getVerificationDocumentUrl(filePath: string, expiresIn = 3600) {
        try {
            const { data, error } = await this.supabase.client.storage
                .from('events')
                .createSignedUrl(filePath, expiresIn);

            if (error) throw error;
            return { data: data?.signedUrl || null, error: null };
        } catch (error) {
            console.error('Error getting verification document URL:', error);
            return { data: null, error };
        }
    }
}
