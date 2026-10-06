import { Module } from '@nestjs/common';
import { IdentityAccessModule } from '../identity-access/identity-access.module';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { AdminRegistrationsService } from './admin-registrations.service';

@Module({
  imports: [IdentityAccessModule],
  controllers: [AdminRegistrationsController],
  providers: [AdminRegistrationsService],
})
export class AdminModule {}
