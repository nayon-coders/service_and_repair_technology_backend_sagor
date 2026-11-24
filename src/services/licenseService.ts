import https from 'https';
import http from 'http';
import { prisma } from '../config/prisma';

export interface LicenseState {
  isValid: boolean;
  isPermanent: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  message: string;
  contactPhone?: string;
  contactEmail?: string;
  lastChecked?: string;
}

const REMOTE_URL =
  process.env.LICENSE_REMOTE_URL ||
  'https://raw.githubusercontent.com/nayon-coders/service_and_repair_technology_backend_sagor/main/license-status.json';

const MASTER_PERMANENT_KEYS = [
  'SRT-PERMANENT-2026-LIFETIME-SECURE-KEY',
  'SAGOR-UNLIMITED-OFFLINE-2026',
];

class LicenseService {
  private currentState: LicenseState = {
    isValid: true,
    isPermanent: false,
    status: 'ACTIVE',
    message: '',
  };

  private isChecking = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      await this.loadLocalState();
      // Perform initial check on boot
      this.checkRemoteLicense().catch(() => {});

      // Schedule periodic check every 20 minutes
      setInterval(() => {
        this.checkRemoteLicense().catch(() => {});
      }, 20 * 60 * 1000);
    } catch (err) {
      console.warn('[LicenseService] Init error:', err);
    }
  }

  private async loadLocalState(): Promise<void> {
    try {
      const permanentSetting = await prisma.systemSetting.findUnique({
        where: { key: 'license_is_permanent' },
      });
      if (permanentSetting?.value === 'true') {
        this.currentState.isPermanent = true;
        this.currentState.isValid = true;
        this.currentState.status = 'ACTIVE';
        return;
      }

      const statusSetting = await prisma.systemSetting.findUnique({
        where: { key: 'license_status' },
      });
      const messageSetting = await prisma.systemSetting.findUnique({
        where: { key: 'license_message' },
      });

      if (statusSetting?.value === 'SUSPENDED') {
        this.currentState.isValid = false;
        this.currentState.status = 'SUSPENDED';
        this.currentState.message = messageSetting?.value || 'Service is temporarily suspended.';
      }
    } catch {
      // If table empty on fresh boot, keep defaults
    }
  }

  private async saveLocalState(status: 'ACTIVE' | 'SUSPENDED', message: string, phone?: string) {
    try {
      await prisma.systemSetting.upsert({
        where: { key: 'license_status' },
        create: { key: 'license_status', value: status },
        update: { value: status },
      });

      await prisma.systemSetting.upsert({
        where: { key: 'license_message' },
        create: { key: 'license_message', value: message },
        update: { value: message },
      });

      if (phone) {
        await prisma.systemSetting.upsert({
          where: { key: 'license_contact_phone' },
          create: { key: 'license_contact_phone', value: phone },
          update: { value: phone },
        });
      }

      await prisma.systemSetting.upsert({
        where: { key: 'license_last_checked' },
        create: { key: 'license_last_checked', value: new Date().toISOString() },
        update: { value: new Date().toISOString() },
      });
    } catch (err) {
      console.error('[LicenseService] Failed to persist license state:', err);
    }
  }

  public async checkRemoteLicense(): Promise<LicenseState> {
    if (this.currentState.isPermanent) {
      return this.currentState;
    }

    if (this.isChecking) {
      return this.currentState;
    }

    this.isChecking = true;

    try {
      const remoteData = await this.fetchRemoteConfig(REMOTE_URL);
      if (remoteData && typeof remoteData.active === 'boolean') {
        if (!remoteData.active) {
          // REMOTELY KILLED / SUSPENDED BY DEVELOPER
          const msg =
            remoteData.message ||
            'সফটওয়্যারের লাইসেন্স বা পেমেন্ট সংক্রান্ত কারণে সার্ভিস সাময়িকভাবে স্থগিত করা হয়েছে। অনুগ্রহ করে ডেভেলপারের সাথে যোগাযোগ করুন।';

          this.currentState.isValid = false;
          this.currentState.status = 'SUSPENDED';
          this.currentState.message = msg;
          this.currentState.contactPhone = remoteData.contactPhone;
          this.currentState.contactEmail = remoteData.contactEmail;

          await this.saveLocalState('SUSPENDED', msg, remoteData.contactPhone);
          console.warn('🛑 [LicenseService] REMOTE KILL SWITCH ACTIVE! Software Suspended.');
        } else {
          // ACTIVE
          this.currentState.isValid = true;
          this.currentState.status = 'ACTIVE';
          this.currentState.message = '';
          this.currentState.contactPhone = remoteData.contactPhone;
          this.currentState.contactEmail = remoteData.contactEmail;

          await this.saveLocalState('ACTIVE', '', remoteData.contactPhone);
          console.log('✅ [LicenseService] License verified active.');
        }
      }
    } catch (e: any) {
      // Offline / Network unreachable
      console.log('[LicenseService] Network check skipped (offline or unreachable):', e.message);
      // If locally marked SUSPENDED, keep suspended!
      await this.loadLocalState();
    } finally {
      this.isChecking = false;
    }

    return this.currentState;
  }

  private fetchRemoteConfig(url: string, timeoutMs = 4500): Promise<any> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(
        url,
        {
          headers: {
            'User-Agent': 'ServiceRepairTechnology-LicenseChecker/1.0',
            'Cache-Control': 'no-cache',
          },
        },
        (res) => {
          if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
            res.resume();
            return reject(new Error(`HTTP status ${res.statusCode}`));
          }

          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json);
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      req.on('error', reject);
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  public async activatePermanentKey(key: string): Promise<{ success: boolean; message: string }> {
    const trimmed = (key || '').trim();
    if (MASTER_PERMANENT_KEYS.includes(trimmed)) {
      this.currentState.isPermanent = true;
      this.currentState.isValid = true;
      this.currentState.status = 'ACTIVE';
      this.currentState.message = '';

      await prisma.systemSetting.upsert({
        where: { key: 'license_is_permanent' },
        create: { key: 'license_is_permanent', value: 'true' },
        update: { value: 'true' },
      });

      await this.saveLocalState('ACTIVE', '');

      return {
        success: true,
        message: 'Master license key accepted. Software permanently unlocked offline!',
      };
    }

    return {
      success: false,
      message: 'Invalid license key. Please check and try again.',
    };
  }

  public getState(): LicenseState {
    return this.currentState;
  }
}

export const licenseService = new LicenseService();
