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

/** Public TrackDart third-party page (no captcha / session). */
const TRACK_URL =
  'https://www.bluedart.com/trackdartresultthirdparty';
const OFFICIAL_TRACK_URL = 'https://www.bluedart.com/tracking';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function fieldMap(tableHtml: string): Record<string, string> {
  const out: Record<string, string> = {};
  const rows = [
    ...tableHtml.matchAll(
      /<tr[\s\S]*?<th[\s\S]*?>([\s\S]*?)<\/th>[\s\S]*?<td[\s\S]*?>([\s\S]*?)<\/td>/gi,
    ),
  ];
  for (const row of rows) {
    const key = stripHtml(row[1]).replace(/\s+/g, ' ');
    const val = stripHtml(row[2]);
    if (key) out[key] = val;
  }
  return out;
}

function parseScans(scanHtml: string): TrackingEvent[] {
  const events: TrackingEvent[] = [];
  const rows = [...scanHtml.matchAll(/<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi)];
  for (const row of rows) {
    const cells = [
      ...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi),
    ].map((c) => stripHtml(c[1]));
    if (cells.length < 4) continue;
    if (/^location$/i.test(cells[0]) || /status and scans/i.test(cells[0])) {
      continue;
    }
    if (/24\s*hr/i.test(cells[0])) continue;
    const [location, details, date, time] = cells;
    events.push({
      job: details || null,
      date: [date, time].filter(Boolean).join(' ') || null,
      route: location || null,
    });
  }
  return events;
}

@Injectable()
export class BlueDartTrackingProvider implements TrackingProviderAdapter {
  readonly provider = TrackingProvider.BLUEDART;
  private readonly logger = new Logger(BlueDartTrackingProvider.name);

  async track(documentNumber: string): Promise<TrackingResult> {
    const awb = documentNumber.trim();
    if (!/^\d{9,15}$/.test(awb)) {
      throw new BadGatewayException(
        'Blue Dart Document Number must be a numeric waybill',
      );
    }

    try {
      const url = `${TRACK_URL}?trackFor=0&trackNo=${encodeURIComponent(awb)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': UA,
          Referer: 'https://www.bluedart.com/',
        },
      });

      if (!res.ok) {
        throw new BadGatewayException(`Blue Dart tracking HTTP ${res.status}`);
      }

      const html = await res.text();
      const shipMatch = html.match(
        new RegExp(`id="SHIP${awb}"[\\s\\S]*?</table>`, 'i'),
      );
      const scanMatch = html.match(
        new RegExp(`id="SCAN${awb}"[\\s\\S]*?</table>`, 'i'),
      );

      if (!shipMatch && !scanMatch) {
        throw new BadGatewayException(
          'No Blue Dart tracking details found for this Document Number',
        );
      }

      const fields = shipMatch ? fieldMap(shipMatch[0]) : {};
      const events = scanMatch ? parseScans(scanMatch[0]) : [];
      const statusText =
        fields['Status'] ||
        events[0]?.job ||
        null;

      return {
        provider: this.provider,
        documentNumber: fields['Waybill No'] || awb,
        statusText,
        booking: {
          fromCenter: fields['From'] || null,
          toCenter: fields['To'] || null,
          bookedAt: fields['Pickup Date'] || null,
          consignee: fields['Recipient'] || null,
        },
        events,
        officialUrl: `${OFFICIAL_TRACK_URL}?trackFor=0&trackNo=${encodeURIComponent(awb)}`,
        trackedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      this.logger.warn(
        `Blue Dart track failed for ${awb}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new BadGatewayException(
        'Failed to fetch live status from Blue Dart',
      );
    }
  }
}
