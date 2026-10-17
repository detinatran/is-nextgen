import { Module } from '@nestjs/common';
import { RegistrationsController } from './registrations.controller';
import { MeRegistrationController } from './me-registration.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationFormService } from './registration-form.service';
import { RegistrationCapabilityGuard } from './registration-capability.guard';
import { MediaModule } from '../media/media.module';
import { IdentityAccessModule } from '../identity-access/identity-access.module';

@Module({
  imports: [MediaModule, IdentityAccessModule],
  controllers: [RegistrationsController, MeRegistrationController],
  providers: [RegistrationsService, RegistrationFormService, RegistrationCapabilityGuard],
  exports: [RegistrationsService, RegistrationCapabilityGuard],
})
export class RegistrationsModule {}
