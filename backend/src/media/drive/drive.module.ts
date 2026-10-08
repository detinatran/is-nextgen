import { Module } from '@nestjs/common';
import { DriveSyncWorker } from './drive-sync.worker';
import { DriveService } from './drive.service';

@Module({
  providers: [DriveService, DriveSyncWorker],
  exports: [DriveService],
})
export class DriveModule {}
