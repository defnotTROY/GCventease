import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Student {
    id?: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    course?: string;
    yearLevel?: string;
    section?: string;
}

@Injectable({
    providedIn: 'root'
})
export class StudentService {
    private apiUrl = environment.studentApiUrl;
    private apiKey = environment.studentApiKey;

    constructor(private http: HttpClient) { }

    /**
     * Get headers with API key
     */
    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey
        });
    }

    /**
     * Get all students
     */
    async getAllStudents(): Promise<Student[]> {
        try {
            const students = await firstValueFrom(
                this.http.get<Student[]>(`${this.apiUrl}/students`, {
                    headers: this.getHeaders()
                })
            );
            return students || [];
        } catch (error) {
            console.error('Error fetching students:', error);
            return [];
        }
    }

    /**
     * Get student by student number
     */
    async getStudentByNumber(studentNumber: string): Promise<Student | null> {
        try {
            const students = await this.getAllStudents();
            const student = students.find(s =>
                s.studentNumber.toLowerCase() === studentNumber.toLowerCase()
            );
            return student || null;
        } catch (error) {
            console.error('Error fetching student:', error);
            return null;
        }
    }

    /**
     * Validate student number exists
     */
    async validateStudentNumber(studentNumber: string): Promise<boolean> {
        const student = await this.getStudentByNumber(studentNumber);
        return student !== null;
    }

    /**
     * Get student by email
     */
    async getStudentByEmail(email: string): Promise<Student | null> {
        try {
            const students = await this.getAllStudents();
            const student = students.find(s =>
                s.email.toLowerCase() === email.toLowerCase()
            );
            return student || null;
        } catch (error) {
            console.error('Error fetching student by email:', error);
            return null;
        }
    }

    /**
     * Search students by name or student number
     */
    async searchStudents(query: string): Promise<Student[]> {
        try {
            const students = await this.getAllStudents();
            const lowerQuery = query.toLowerCase();

            return students.filter(s =>
                s.studentNumber.toLowerCase().includes(lowerQuery) ||
                s.firstName.toLowerCase().includes(lowerQuery) ||
                s.lastName.toLowerCase().includes(lowerQuery) ||
                s.email.toLowerCase().includes(lowerQuery)
            );
        } catch (error) {
            console.error('Error searching students:', error);
            return [];
        }
    }

    /**
     * Generate Gordon College email from student number
     * Format: studentnumber@gordoncollege.edu.ph
     */
    generateEmailFromStudentNumber(studentNumber: string): string {
        return `${studentNumber.toLowerCase()}@gordoncollege.edu.ph`;
    }
}
