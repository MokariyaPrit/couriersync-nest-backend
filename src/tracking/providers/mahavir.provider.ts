import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { TrackingProvider } from '@/shared';
import type {
  TrackingEvent,
  TrackingProviderAdapter,
  TrackingResult,
} from '../tracking.types';

const ORIGIN = 'https://shreemahavircourier.com';
const HOME_URL = `${ORIGIN}/index.aspx`;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

function pickValue(html: string, id: string) {
  const m = html.match(new RegExp(`id="${id}"[^>]*value="([^"]*)"`, 'i'));
  return m?.[1] ?? '';
}

function spanText(html: string, id: string) {
  const m = html.match(
    new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)</(?:span|label)>`, 'i'),
  );
  if (!m) return null;
  return m[1]
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .trim();
}

function absoluteUrl(pathOrUrl: string) {
  const cleaned = pathOrUrl.replace(/&amp;/gi, '&').trim();
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  return `${ORIGIN}/${cleaned.replace(/^\//, '')}`;
}

function cellText(raw: string) {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseEvents(html: string): TrackingEvent[] {
  const tableMatch = html.match(/id="tblTrack"[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return [];
  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const events: TrackingEvent[] = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (c) => cellText(c[1]),
    );
    if (cells.length < 2) continue;
    if (/^job$/i.test(cells[0]) || /^date$/i.test(cells[1])) continue;
    const dateParts = [cells[1], cells[3]].filter(Boolean);
    events.push({
      job: cells[0] || null,
      date: dateParts.join(' ') || null,
      route: cells[2] || null,
    });
  }
  return events;
}

@Injectable()
export class MahavirTrackingProvider implements TrackingProviderAdapter {
  readonly provider = TrackingProvider.MAHAVIR;
  private readonly logger = new Logger(MahavirTrackingProvider.name);

  async track(documentNumber: string): Promise<TrackingResult> {
    const awb = documentNumber.trim();
    if (!/^\d{6,20}$/.test(awb)) {
      throw new BadGatewayException(
        'Mahavir Document Number must be a numeric AWB',
      );
    }

    try {
      const homeHtml = await this.fetchText(HOME_URL);
      const body = new URLSearchParams({
        __VIEWSTATE: pickValue(homeHtml, '__VIEWSTATE'),
        __VIEWSTATEGENERATOR: pickValue(homeHtml, '__VIEWSTATEGENERATOR'),
        __EVENTVALIDATION: pickValue(homeHtml, '__EVENTVALIDATION'),
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        txtAWBNo: awb,
        cmdTrack: 'Tracking',
      });

      const post = await fetch(HOME_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': UA,
          Referer: HOME_URL,
        },
        body,
        redirect: 'manual',
      });

      const location = post.headers.get('location');
      if (!location || post.status < 300 || post.status >= 400) {
        throw new BadGatewayException(
          'Mahavir tracking form did not return a result redirect',
        );
      }

      const listUrl = absoluteUrl(location);
      if (/NotAvailable/i.test(listUrl)) {
        throw new BadGatewayException(
          'Mahavir rejected this Document Number (not available)',
        );
      }

      const listHtml = await this.fetchText(listUrl, HOME_URL);
      const detailMatch = listHtml.match(
        /Frm_DocTrack(?:Web)?\.aspx\?[^"'\s<>]+/i,
      );
      if (!detailMatch) {
        throw new BadGatewayException(
          'No Mahavir tracking details found for this Document Number',
        );
      }

      const detailUrl = absoluteUrl(detailMatch[0]);
      const detailHtml = await this.fetchText(detailUrl, listUrl);
      const statusText = spanText(detailHtml, 'lblStatus');
      const fromCenter = spanText(detailHtml, 'txtFromCenter');
      const toCenter = spanText(detailHtml, 'txtToCenter');
      const bookedAt = spanText(detailHtml, 'txtDate');
      const consignee = spanText(detailHtml, 'txtReceiver');
      const shownDoc =
        spanText(detailHtml, 'lblDocNumber') ||
        spanText(detailHtml, 'txtDocNo');

      if (!statusText && !fromCenter && !toCenter && !shownDoc) {
        throw new BadGatewayException(
          'No Mahavir tracking details found for this Document Number',
        );
      }

      return {
        provider: this.provider,
        documentNumber: shownDoc || awb,
        statusText,
        booking: {
          fromCenter,
          toCenter,
          bookedAt,
          consignee,
        },
        events: parseEvents(detailHtml),
        officialUrl: detailUrl,
        trackedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      this.logger.warn(
        `Mahavir track failed for ${awb}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new BadGatewayException(
        'Failed to fetch live status from Shree Mahavir Courier',
      );
    }
  }

  private async fetchText(url: string, referer?: string) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        ...(referer ? { Referer: referer } : {}),
      },
      redirect: 'follow',
    });
    if (!res.ok) {
      throw new BadGatewayException(
        `Mahavir HTTP ${res.status} for ${url.split('.com')[1] || url}`,
      );
    }
    return res.text();
  }
}
