import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { AttemptFinalizationService } from './finalization.service';
import { TimeoutWorker } from './timeout.worker';
import { IdentityAccessModule } from '../identity-access/identity-access.module';

@Module({
  imports: [IdentityAccessModule],
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptFinalizationService, TimeoutWorker],
  exports: [AttemptsService, AttemptFinalizationService],
})
export class AttemptsModule {}
