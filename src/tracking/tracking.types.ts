export type TrackingEvent = {
  job: string | null;
  date: string | null;
  route: string | null;
};

export type TrackingResult = {
  provider: string;
  documentNumber: string;
  statusText: string | null;
  booking: {
    fromCenter: string | null;
    toCenter: string | null;
    bookedAt: string | null;
    consignee: string | null;
  } | null;
  events: TrackingEvent[];
  officialUrl: string;
  trackedAt: string;
};

export interface TrackingProviderAdapter {
  readonly provider: string;
  track(documentNumber: string): Promise<TrackingResult>;
}
