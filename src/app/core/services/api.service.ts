import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = environment.backendUrl;

    constructor(private http: HttpClient) { }

    /**
     * GET request
     */
    get<T>(endpoint: string, params?: any): Observable<T> {
        const options = {
            params: this.buildParams(params)
        };
        return this.http.get<T>(`${this.baseUrl}/${endpoint}`, options)
            .pipe(catchError(this.handleError));
    }

    /**
     * POST request
     */
    post<T>(endpoint: string, body: any): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body)
            .pipe(catchError(this.handleError));
    }

    /**
     * PUT request
     */
    put<T>(endpoint: string, body: any): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body)
            .pipe(catchError(this.handleError));
    }

    /**
     * DELETE request
     */
    delete<T>(endpoint: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}/${endpoint}`)
            .pipe(catchError(this.handleError));
    }

    /**
     * PATCH request
     */
    patch<T>(endpoint: string, body: any): Observable<T> {
        return this.http.patch<T>(`${this.baseUrl}/${endpoint}`, body)
            .pipe(catchError(this.handleError));
    }

    /**
     * Build HTTP params from object
     */
    private buildParams(params?: any): HttpParams {
        let httpParams = new HttpParams();
        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined) {
                    httpParams = httpParams.set(key, params[key].toString());
                }
            });
        }
        return httpParams;
    }

    /**
     * Error handler
     */
    private handleError(error: any) {
        console.error('API Error:', error);
        const errorMessage = error.error?.message || error.message || 'An error occurred';
        return throwError(() => new Error(errorMessage));
    }
}
