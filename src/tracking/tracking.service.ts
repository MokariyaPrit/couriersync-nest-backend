import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, TrackingProvider } from '@/shared';
import { Repository } from 'typeorm';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { Consignment } from '../entities/consignment.entity';
import { TirupatiTrackingProvider } from './providers/tirupati.provider';
import type {
  TrackingProviderAdapter,
  TrackingResult,
} from './tracking.types';

@Injectable()
export class TrackingService {
  private readonly adapters: Map<string, TrackingProviderAdapter>;

  constructor(
    @InjectRepository(Consignment)
    private readonly consignmentsRepo: Repository<Consignment>,
    tirupati: TirupatiTrackingProvider,
  ) {
    this.adapters = new Map([[TrackingProvider.TIRUPATI, tirupati]]);
  }

  async trackConsignment(
    id: string,
    user: AuthUser,
  ): Promise<TrackingResult> {
    const consignment = await this.consignmentsRepo.findOne({
      where: { id },
      relations: { courierCompany: true },
    });
    if (!consignment) {
      throw new NotFoundException('Consignment not found');
    }

    if (
      user.role !== Role.ADMIN &&
      consignment.createdById &&
      consignment.createdById !== user.id
    ) {
      throw new NotFoundException('Consignment not found');
    }

    const company = consignment.courierCompany;
    if (!company?.trackingProvider) {
      throw new BadRequestException(
        'Selected courier company does not support live tracking',
      );
    }

    const awb = consignment.awb?.trim();
    if (!awb) {
      throw new BadRequestException('Booking has no Document Number to track');
    }

    const adapter = this.adapters.get(company.trackingProvider);
    if (!adapter) {
      throw new BadRequestException(
        `Tracking provider "${company.trackingProvider}" is not configured`,
      );
    }

    return adapter.track(awb);
  }
}
