interface GoogleAuthResponse {
  access_token?: string;
  error?: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: GoogleAuthResponse) => void;
            prompt?: string;
          }): {
            requestAccessToken(config?: {
              callback?: (response: GoogleAuthResponse) => void;
              prompt?: string;
            }): void;
          };
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!GOOGLE_CLIENT_ID) {
  console.error('Google Client ID not found in environment variables');
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private initializationStatus: 'not_started' | 'in_progress' | 'completed' | 'failed' = 'not_started';
  private initError: Error | null = null;

  private constructor() {}

  static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  getInitializationStatus() {
    return {
      status: this.initializationStatus,
      error: this.initError
    };
  }

  private async waitForGoogleLoad(maxAttempts: number = 20): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const checkGoogle = () => {
        attempts++;
        console.log(`[Google API] 檢查加載狀態 (${attempts}/${maxAttempts})`);
        
        if (window.googleApiLoaded) {
          console.log('[Google API] 檢測到 API 已加載完成');
          resolve();
        } else if (attempts >= maxAttempts) {
          const error = new Error('Google API 加載超時');
          console.error('[Google API]', error);
          reject(error);
        } else {
          console.log('[Google API] 等待加載中...');
          setTimeout(checkGoogle, 500);
        }
      };
      checkGoogle();
    });
  }

  async init(): Promise<void> {
    if (this.tokenClient) {
      console.log('[Google API] 已經初始化過');
      return;
    }

    if (this.initializationStatus === 'in_progress') {
      console.log('[Google API] 初始化正在進行中');
      return;
    }

    this.initializationStatus = 'in_progress';
    console.log('[Google API] 開始初始化流程');

    try {
      await this.waitForGoogleLoad();
      
      console.log('[Google API] 初始化 token client');
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: GoogleAuthResponse) => {
          if (response.access_token) {
            console.log('[Google API] Token client 初始化成功');
          }
        },
      });

      this.initializationStatus = 'completed';
      console.log('[Google API] 初始化完成');
    } catch (error) {
      this.initializationStatus = 'failed';
      this.initError = error as Error;
      console.error('[Google API] 初始化失敗:', error);
      throw error;
    }
  }

  async authenticate(): Promise<string> {
    try {
      if (!this.tokenClient) {
        console.log('初始化 token client');
        await this.init();
      }

      return new Promise((resolve, reject) => {
        if (!this.tokenClient) {
          reject(new Error('Token client not initialized'));
          return;
        }

        console.log('請求訪問令牌');
        this.tokenClient.requestAccessToken({
          callback: (response: GoogleAuthResponse) => {
            if (response.error) {
              console.error('授權錯誤:', response.error);
              reject(new Error(`授權失敗: ${response.error}`));
            } else if (response.access_token) {
              console.log('成功獲取訪問令牌');
              resolve(response.access_token);
            } else {
              console.error('未知錯誤:', response);
              reject(new Error('無法獲取訪問令牌'));
            }
          },
          prompt: 'consent'
        });
      });
    } catch (error) {
      console.error('認證過程發生錯誤:', error);
      throw error;
    }
  }

  async uploadToDrive(content: string, filename: string): Promise<string> {
    try {
      console.log('開始認證流程');
      const accessToken = await this.authenticate();
      console.log('認證成功，準備上傳文件');

      const file = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
      const metadata = {
        name: filename,
        mimeType: 'text/csv',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      console.log('開始上傳文件到 Google Drive');
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('上傳響應不成功:', response.status, errorText);
        throw new Error(`上傳失敗: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('文件上傳成功:', result);
      return result.id;
    } catch (error) {
      console.error('上傳過程發生錯誤:', error);
      throw error;
    }
  }
} 