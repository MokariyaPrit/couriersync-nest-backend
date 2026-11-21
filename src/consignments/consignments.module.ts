import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consignment } from '../entities/consignment.entity';
import { InvoiceConsignment } from '../entities/invoice-consignment.entity';
import { TrackingModule } from '../tracking/tracking.module';
import { ConsignmentsController } from './consignments.controller';
import { ConsignmentsService } from './consignments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consignment, InvoiceConsignment]),
    TrackingModule,
  ],
  controllers: [ConsignmentsController],
  providers: [ConsignmentsService],
  exports: [ConsignmentsService],
})
export class ConsignmentsModule {}
