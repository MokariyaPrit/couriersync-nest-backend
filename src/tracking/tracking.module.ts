import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consignment } from '../entities/consignment.entity';
import { AnjaniTrackingProvider } from './providers/anjani.provider';
import { MahavirTrackingProvider } from './providers/mahavir.provider';
import { TirupatiTrackingProvider } from './providers/tirupati.provider';
import { TrackingService } from './tracking.service';

@Module({
  imports: [TypeOrmModule.forFeature([Consignment])],
  providers: [
    TirupatiTrackingProvider,
    AnjaniTrackingProvider,
    MahavirTrackingProvider,
    TrackingService,
  ],
  exports: [TrackingService],
})
export class TrackingModule {}
