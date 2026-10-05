import { Module } from '@nestjs/common';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationFormService } from './registration-form.service';
import { RegistrationCapabilityGuard } from './registration-capability.guard';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [MediaModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, RegistrationFormService, RegistrationCapabilityGuard],
  exports: [RegistrationsService, RegistrationCapabilityGuard],
})
export class RegistrationsModule {}
