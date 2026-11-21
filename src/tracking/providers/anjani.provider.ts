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

const API_BASE = 'https://api-customer.shreeanjani.co.in/public/awb';
const OFFICIAL_TRACK_URL = 'https://shreeanjani.co.in/tracking';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

type AnjaniTrackingRow = {
  status_name?: string | null;
  scanned_center_name?: string | null;
  from_center_name?: string | null;
  to_center_name?: string | null;
  created_at?: string | null;
};

type AnjaniBooking = {
  barcode_number?: string | null;
  booking_date?: string | null;
  from_center_name?: string | null;
  to_center_name?: string | null;
  status_name?: string | null;
  reason_name?: string | null;
  status_date?: string | null;
};

type AnjaniResponse = {
  success?: boolean;
  data?: {
    booking?: AnjaniBooking | null;
    booking_tracking?: AnjaniTrackingRow[] | null;
  } | null;
  message?: string;
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

@Injectable()
export class AnjaniTrackingProvider implements TrackingProviderAdapter {
  readonly provider = TrackingProvider.ANJANI;
  private readonly logger = new Logger(AnjaniTrackingProvider.name);

  async track(documentNumber: string): Promise<TrackingResult> {
    const awb = documentNumber.trim();
    if (!/^\d{6,20}$/.test(awb)) {
      throw new BadGatewayException(
        'Anjani Document Number must be a numeric AWB',
      );
    }

    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(awb)}`, {
        headers: {
          Accept: 'application/json, text/plain, */*',
          Origin: 'https://shreeanjani.co.in',
          Referer: 'https://shreeanjani.co.in/',
          'User-Agent': UA,
        },
      });

      if (!res.ok) {
        throw new BadGatewayException(
          `Anjani tracking HTTP ${res.status}`,
        );
      }

      const json = (await res.json()) as AnjaniResponse;
      const booking = json.data?.booking;
      if (!json.success || !booking) {
        throw new BadGatewayException(
          json.message ||
            'No Anjani tracking details found for this Document Number',
        );
      }

      const events: TrackingEvent[] = (json.data?.booking_tracking ?? []).map(
        (row) => ({
          job: row.status_name || null,
          date: formatDate(row.created_at),
          route: [
            row.scanned_center_name,
            row.from_center_name && row.to_center_name
              ? `${row.from_center_name} → ${row.to_center_name}`
              : row.from_center_name || row.to_center_name,
          ]
            .filter(Boolean)
            .join(' · ') || null,
        }),
      );

      return {
        provider: this.provider,
        documentNumber: booking.barcode_number || awb,
        statusText: booking.status_name || booking.reason_name || null,
        booking: {
          fromCenter: booking.from_center_name || null,
          toCenter: booking.to_center_name || null,
          bookedAt: formatDate(booking.booking_date),
          consignee: null,
        },
        events,
        officialUrl: `${OFFICIAL_TRACK_URL}?awb=${encodeURIComponent(
          booking.barcode_number || awb,
        )}`,
        trackedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      this.logger.warn(
        `Anjani track failed for ${awb}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new BadGatewayException(
        'Failed to fetch live status from Shree Anjani Courier',
      );
    }
  }
}
