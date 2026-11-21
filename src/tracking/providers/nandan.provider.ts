import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import { TrackingProvider } from '@/shared';
import type {
  TrackingEvent,
  TrackingProviderAdapter,
  TrackingResult,
} from '../tracking.types';

const API_URL =
  'https://api.connectingnandan.com/v1/website/tracking/web-view/consignment';
const SITE_ORIGIN = 'https://www.shreenandancourier.com';
const API_KEY = 'NANDAN_OPERATION_WEBSITE_2026';
const APP_ID = '1';
/** Public website payload crypto (from their frontend bundle). */
const CRYPTO = {
  KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
  IV: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
  SECRET: 'X9kL2mN4pQ7rS1tU3vW5xY8zA0bC6dE',
};
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

type NandanBooking = {
  con_no?: string | null;
  bk_status?: string | null;
  bk_date?: string | null;
  bk_state?: string | null;
  product?: string | null;
  r_name?: string | null;
  r_city?: string | null;
  pincode?: string | number | null;
  center?: string | null;
  center_name?: string | null;
  center_mobile?: string | null;
  from_center?: string | null;
  to_center?: string | null;
  service_type?: string | null;
};

type NandanTravel = {
  status?: string | null;
  status_name?: string | null;
  event?: string | null;
  center?: string | null;
  center_name?: string | null;
  date?: string | null;
  created?: string | null;
  remarks?: string | null;
  from_center?: string | null;
  to_center?: string | null;
  description?: string | null;
  /** Domestic scan payload fields */
  org_name?: string | null;
  next_name?: string | null;
  ti_name?: string | null;
  ta_name?: string | null;
  from_address?: string | null;
  to_address?: string | null;
  result?: string | null;
  result1?: string | null;
  result2?: string | null;
  result3?: string | null;
};

type NandanDelivery = {
  delivery_status?: string | null;
  delivery_date?: string | null;
  received_by?: string | null;
  center?: string | null;
  r_city?: string | null;
  product?: string | null;
  drs_date?: string | null;
};

type NandanView = {
  view_type?: string | null;
  con_no?: string | null;
  booking?: NandanBooking | NandanBooking[] | null;
  traveling_info?: NandanTravel[] | null;
  delivery_details?: NandanDelivery[] | null;
  drs?: {
    center?: string | null;
    drs_date?: string | null;
    area?: string | null;
  } | null;
};

type NandanResponse = {
  STATUS?: { NOTIFICATION?: string[] };
  view?: NandanView | null;
  message?: string;
};

function encryptField(value: string | number) {
  const t = String(value);
  const salt = CryptoJS.lib.WordArray.random(8).toString(CryptoJS.enc.Hex);
  const ts = Date.now().toString();
  const hmac = CryptoJS.HmacSHA256(salt + ts + t, CRYPTO.SECRET).toString();
  const payload = `${salt}|${ts}|${hmac}|${t}`;
  return CryptoJS.AES.encrypt(payload, CryptoJS.enc.Hex.parse(CRYPTO.KEY), {
    iv: CryptoJS.enc.Hex.parse(CRYPTO.IV),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

function encryptBody(obj: Record<string, string | number>) {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    out[encryptField(key)] = encryptField(value);
  }
  return out;
}

/** URL token used by /track-shipment/:id */
function encodeUrlToken(value: string) {
  const key = CryptoJS.enc.Hex.parse(CRYPTO.KEY);
  const salt = CryptoJS.lib.WordArray.random(8);
  const iv = salt
    .clone()
    .concat(CryptoJS.lib.WordArray.create([0, 0], 8));
  const encrypted = CryptoJS.AES.encrypt(String(value), key, {
    iv,
    mode: CryptoJS.mode.CTR,
    padding: CryptoJS.pad.NoPadding,
  });
  return CryptoJS.enc.Base64.stringify(salt.concat(encrypted.ciphertext))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function asBooking(
  booking: NandanView['booking'],
): NandanBooking | null {
  if (!booking) return null;
  if (Array.isArray(booking)) return booking[0] ?? null;
  return booking;
}

function mergeViews(parts: Array<NandanView | null | undefined>): NandanView {
  const out: NandanView = {};
  for (const part of parts) {
    if (!part) continue;
    Object.assign(out, part);
    // Prefer non-empty arrays/objects from later meaningful payloads
    if (part.traveling_info?.length) out.traveling_info = part.traveling_info;
    if (part.delivery_details?.length) {
      out.delivery_details = part.delivery_details;
    }
    const booking = asBooking(part.booking);
    if (booking && Object.keys(booking).length) out.booking = booking;
    if (part.drs) out.drs = part.drs;
    if (part.con_no) out.con_no = part.con_no;
  }
  return out;
}

@Injectable()
export class NandanTrackingProvider implements TrackingProviderAdapter {
  readonly provider = TrackingProvider.NANDAN;
  private readonly logger = new Logger(NandanTrackingProvider.name);

  async track(documentNumber: string): Promise<TrackingResult> {
    const awb = documentNumber.trim();
    if (!/^\d{6,13}$/.test(awb)) {
      throw new BadGatewayException(
        'Nandan Document Number must be a numeric AWB (up to 13 digits)',
      );
    }

    try {
      // Domestic public track (home form) uses purpose 1/2/3 + client_id 0.
      // 1 = traveling history, 2 = booking, 3 = delivery / DRS.
      const [travel, bookingView, deliveryView] = await Promise.all([
        this.fetchView({
          con_no: awb,
          purpose: '1',
          is_external_tracking: 1,
          client_id: 0,
        }),
        this.fetchView({
          con_no: awb,
          purpose: '2',
          is_external_tracking: 1,
          client_id: 0,
        }),
        this.fetchView({
          con_no: awb,
          purpose: '3',
          is_external_tracking: 1,
          client_id: 0,
        }),
      ]);

      const view = mergeViews([travel, bookingView, deliveryView]);
      const booking = asBooking(view.booking);
      const delivery = view.delivery_details?.[0] ?? null;
      const shownDoc = view.con_no || booking?.con_no || awb;

      const statusText =
        [delivery?.delivery_status, delivery?.delivery_date]
          .filter(Boolean)
          .join(' · ') ||
        booking?.bk_status ||
        (view.drs?.center
          ? `At ${view.drs.center}${
              view.drs.drs_date ? ` · ${view.drs.drs_date}` : ''
            }`
          : null);

      if (
        !statusText &&
        !booking &&
        !delivery &&
        !view.traveling_info?.length
      ) {
        throw new BadGatewayException(
          'No Nandan tracking details found for this Document Number',
        );
      }

      const events: TrackingEvent[] = (view.traveling_info ?? []).map((row) => {
        const center =
          row.org_name ||
          row.center_name ||
          row.center ||
          null;
        const next = row.next_name || row.to_center || null;
        const job =
          row.result1?.trim() ||
          row.result?.replace(/\s+/g, ' ').trim() ||
          row.status_name ||
          row.status ||
          row.event ||
          [row.ti_name, row.ta_name].filter(Boolean).join(' ') ||
          null;
        return {
          job,
          date: row.date || row.created || null,
          route:
            [
              center && next ? `${center} → ${next}` : center || next,
              row.result2?.trim() || null,
              row.from_address?.trim() || row.to_address?.trim() || null,
              row.remarks?.trim() || null,
            ]
              .filter(Boolean)
              .join(' · ') || null,
        };
      });

      return {
        provider: this.provider,
        documentNumber: shownDoc,
        statusText,
        booking: {
          fromCenter:
            booking?.center ||
            booking?.from_center ||
            booking?.center_name ||
            null,
          toCenter:
            booking?.to_center ||
            booking?.r_city ||
            delivery?.r_city ||
            delivery?.center ||
            null,
          bookedAt: booking?.bk_date || null,
          consignee: booking?.r_name || delivery?.received_by || null,
        },
        events,
        officialUrl: `${SITE_ORIGIN}/track-shipment/${encodeUrlToken(awb)}`,
        trackedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof BadGatewayException) throw err;
      this.logger.warn(
        `Nandan track failed for ${awb}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      throw new BadGatewayException(
        'Failed to fetch live status from Shree Nandan Courier',
      );
    }
  }

  private async fetchView(
    body: Record<string, string | number>,
  ): Promise<NandanView | null> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': API_KEY,
        'app-id': APP_ID,
        Platform: 'WEB',
        Origin: SITE_ORIGIN,
        Referer: `${SITE_ORIGIN}/`,
        'User-Agent': UA,
      },
      body: JSON.stringify(encryptBody(body)),
    });

    if (!res.ok) {
      // Soft-fail individual purpose calls so merge can still succeed
      this.logger.warn(`Nandan purpose ${body.purpose} HTTP ${res.status}`);
      return null;
    }

    const json = (await res.json()) as NandanResponse;
    return json.view ?? null;
  }
}
