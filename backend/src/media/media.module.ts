import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaValidationService } from './media-validation.service';
import { RegistrationCapabilityGuard } from '../registrations/registration-capability.guard';

@Module({
  controllers: [MediaController],
  providers: [MediaService, MediaValidationService, RegistrationCapabilityGuard],
  exports: [MediaService],
})
export class MediaModule {}
