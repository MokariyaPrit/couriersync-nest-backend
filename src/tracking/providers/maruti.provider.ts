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

const API_BASE = 'https://apis-hubops.innofulfill.com/tracking/v2';
const OFFICIAL_TRACK_URL = 'https://shreemaruti.com/track-shipment/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

type MarutiLocation = {
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  landmark?: string | null;
};

type MarutiCpDetails = {
  cpName?: string | null;
  cpCity?: string | null;
  cpAddress?: string | null;
  cpMobile?: string | null;
  cpState?: string | null;
  cpPincode?: string | null;
};

type MarutiStatus = {
  status?: string | null;
  location?: string | null;
  category?: string | null;
  subcategory?: string | null;
  createdAt?: string | null;
  statusTimestamp?: number | null;
  cpDetails?: MarutiCpDetails | null;
  dpDetails?: { daName?: string | null; daMobile?: string | null } | null;
};

type MarutiResponse = {
  orderInformation?: {
    trackingId?: string | null;
    sourceLocation?: MarutiLocation | null;
    destinationLocation?: MarutiLocation | null;
    senderDetails?: {
      sender_name?: string | null;
      sender_mobile?: string | null;
    } | null;
    receiverDetails?: {
      receiver_name?: string | null;
      receiver_mobile?: string | null;
    } | null;
    createdAt?: string | null;
  } | null;
  statuses?: MarutiStatus[] | null;
  message?: string;
};

function formatDate(value?: string | number | null) {
  if (value == null || value === '') return null;
  const d =
    typeof value === 'number' ? new Date(value) : new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function placeLabel(loc?: MarutiLocation | null) {
  if (!loc) return null;
  return (
    [loc.city || loc.landmark, loc.state].filter(Boolean).join(', ') || null
  );
}

@Injectable()
export class MarutiTrackingProvider implements TrackingProviderAdapter {
  readonly provider = TrackingProvider.MARUTI;
  private readonly logger = new Logger(MarutiTrackingProvider.name);

  async track(documentNumber: string): Promise<TrackingResult> {
    const awb = documentNumber.trim();
    if (!/^\d{6,20}$/.test(awb)) {
      throw new BadGatewayException(
        'Maruti Document Number must be a numeric AWB',
      );
    }

    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(awb)}`, {
        headers: {
          Accept: '*/*',
          Origin: 'https://tracking.shreemaruti.com',
          Referer: 'https://tracking.shreemaruti.com/',
          'User-Agent': UA,
        },
      });

      if (!res.ok) {
        throw new BadGatewayException(`Maruti tracking HTTP ${res.status}`);
      }

      const json = (await res.json()) as MarutiResponse;
      const order = json.orderInformation;
      const statuses = json.statuses ?? [];
      if (!order?.trackingId && !statuses.length) {
        throw new BadGatewayException(
          json.message ||
            'No Maruti tracking details found for this Document Number',
        );
      }

      const latest = statuses[0];
      const statusText =
        [latest?.subcategory || latest?.category || latest?.status]
          .filter(Boolean)
          .join(' · ') || null;

      const events: TrackingEvent[] = statuses.map((row) => {
        const center =
          row.cpDetails?.cpName ||
          row.location ||
          row.dpDetails?.daName ||
          null;
        const phone =
          row.cpDetails?.cpMobile || row.dpDetails?.daMobile || null;
        const address = [
          row.cpDetails?.cpAddress,
          row.cpDetails?.cpCity,
          row.cpDetails?.cpState,
          row.cpDetails?.cpPincode,
        ]
          .filter(Boolean)
          .join(', ');
        return {
          job: row.subcategory || row.category || row.status || null,
          date: formatDate(row.createdAt || row.statusTimestamp),
          route:
            [center, phone, address].filter(Boolean).join(' · ') || null,
        };
      });

      return {
        provider: this.provider,
        documentNumber: order?.trackingId || awb,
        statusText,
        booking: {
          fromCenter: placeLabel(order?.sourceLocation),
          toCenter: placeLabel(order?.destinationLocation),
          bookedAt: formatDate(order?.createdAt),
          consignee: order?.receiverDetails?.receiver_name || null,
        },
        events,
        officialUrl: `${OFFICIAL_TRACK_URL}?awb=${encodeURIComponent(awb)}`,
        trackedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      this.logger.warn(
        `Maruti track failed for ${awb}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new BadGatewayException(
        'Failed to fetch live status from Shree Maruti Courier',
      );
    }
  }
}
