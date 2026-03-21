import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PhotomathService {
  constructor(private config: ConfigService) {}

  async recognizeImage(base64Image: string): Promise<{ latex?: string; text?: string; error?: string }> {
    const appId = this.config.get('MATHPIX_APP_ID');
    const appKey = this.config.get('MATHPIX_APP_KEY');

    if (!appId || !appKey) {
      return { error: 'MATHPIX_NOT_CONFIGURED', text: '' };
    }

    const src = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;

    try {
      const res = await fetch('https://api.mathpix.com/v3/latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          app_id: appId,
          app_key: appKey,
        },
        body: JSON.stringify({ src }),
      });

      const data = (await res.json()) as { latex?: string; error?: string };
      if (!res.ok) {
        return { error: data.error || 'MATHPIX_ERROR', text: '' };
      }
      const latex = (data.latex || '').trim();
      return { latex, text: latex };
    } catch (err: any) {
      return { error: err?.message || 'MATHPIX_REQUEST_FAILED', text: '' };
    }
  }
}
