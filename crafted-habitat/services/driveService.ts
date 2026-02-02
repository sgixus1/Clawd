
/**
 * Real Google Drive Sync Service
 * Manages OAuth2 flows and File I/O for a JSON master database
 */

const DB_FILENAME = 'crafted_habitat_master_db.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export interface DriveStatus {
    isAuthenticated: boolean;
    userEmail: string | null;
    lastSync: string | null;
    fileId: string | null;
}

class DriveSyncService {
    private accessToken: string | null = null;
    private client: any = null;

    constructor() {
        this.accessToken = localStorage.getItem('drive_access_token');
    }

    /**
     * Initializes the Google Identity Services client
     * Requires CLIENT_ID from Google Cloud Console
     */
    initAuth(clientId: string, onAuthSuccess: (token: string) => void) {
        if (!(window as any).google) return;
        
        this.client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: DRIVE_SCOPE,
            callback: (response: any) => {
                if (response.error) {
                    console.error("GSI Error:", response.error);
                    throw new Error(`Google Auth Error: ${response.error_description || response.error}`);
                }
                if (response.access_token) {
                    this.accessToken = response.access_token;
                    localStorage.setItem('drive_access_token', response.access_token);
                    onAuthSuccess(response.access_token);
                }
            },
        });
    }

    signIn() {
        if (!this.client) {
            throw new Error("Auth client not initialized. Check your Client ID and Internet connection.");
        }
        this.client.requestAccessToken();
    }

    signOut() {
        this.accessToken = null;
        localStorage.removeItem('drive_access_token');
        localStorage.removeItem('drive_file_id');
        localStorage.removeItem('last_cloud_sync');
    }

    private async request(url: string, options: RequestInit = {}) {
        if (!this.accessToken) {
            throw new Error("Unauthorized: Please sign in with Google.");
        }
        
        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            this.signOut();
            throw new Error("Session expired. Please sign in again.");
        }
        
        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error?.message || `Drive API Error: ${response.status}`);
        }
        
        return response;
    }

    /**
     * Locates the database file or creates it
     */
    async getOrCreateFileId(): Promise<string> {
        const cachedId = localStorage.getItem('drive_file_id');
        if (cachedId) return cachedId;

        // Search for existing file
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${DB_FILENAME}' and trashed=false&fields=files(id)`;
        const response = await this.request(searchUrl);
        const data = await response.json();

        if (data.files && data.files.length > 0) {
            const id = data.files[0].id;
            localStorage.setItem('drive_file_id', id);
            return id;
        }

        // Create new empty file if not found
        const createUrl = 'https://www.googleapis.com/drive/v3/files';
        const createResponse = await this.request(createUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: DB_FILENAME,
                mimeType: 'application/json'
            })
        });
        const newFileData = await createResponse.json();
        localStorage.setItem('drive_file_id', newFileData.id);
        return newFileData.id;
    }

    /**
     * Pulls the latest JSON from Drive
     */
    async pullData(): Promise<any> {
        const fileId = await this.getOrCreateFileId();
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        const response = await this.request(url);
        
        if (response.status === 204) return null;
        
        try {
            return await response.json();
        } catch (e) {
            return null; // File might be empty
        }
    }

    /**
     * Pushes current local state to Drive
     */
    async pushData(data: any): Promise<void> {
        const fileId = await this.getOrCreateFileId();
        // Use standard upload endpoint for metadata + content update
        const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;
        await this.request(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        localStorage.setItem('last_cloud_sync', new Date().toISOString());
    }
}

export const driveService = new DriveSyncService();
