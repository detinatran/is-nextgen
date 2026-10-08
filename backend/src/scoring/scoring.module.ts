import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringWorker } from './scoring.worker';

@Module({
  providers: [ScoringService, ScoringWorker],
  exports: [ScoringService],
})
export class ScoringModule {}
