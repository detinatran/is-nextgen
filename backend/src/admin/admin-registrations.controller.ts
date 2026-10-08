import { Controller, Get, Param, ParseUUIDPipe, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import type { AuthenticatedRequest } from '../common/http/request-context';
import { AdminGuard } from '../identity-access/guards/admin.guard';
import { AuthGuard } from '../identity-access/guards/auth.guard';
import { PermissionGuard, RequirePermission } from '../identity-access/guards/permission.guard';
import { ListRegistrationsQuery } from './dto/admin-registrations.dto';
import { AdminRegistrationsService, type RegistrationFilter } from './admin-registrations.service';

function filterOf(q: ListRegistrationsQuery): RegistrationFilter {
  return {
    competition: q.competition?.trim() || 'ISNG-2026',
    state: q.state === 'ALL' ? undefined : (q.state ?? 'SUBMITTED'),
    school: q.school?.trim() || undefined,
    q: q.q?.trim() || undefined,
  };
}

/** FR-4.2 Admin: candidate registrations (read-only). ADMIN + session MFA + permission per route. */
@ApiTags('admin')
@ApiSecurity('cookie')
@Controller('admin/registrations')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AdminRegistrationsController {
  constructor(private readonly registrations: AdminRegistrationsService) {}

  @Get()
  @RequirePermission('candidate.read')
  @ApiOkResponse({ description: 'Paged registrations with a schools facet' })
  list(@Query() query: ListRegistrationsQuery) {
    return this.registrations.list(filterOf(query), query.page ?? 1, query.pageSize ?? 50);
  }

  @Get('export')
  @RequirePermission('export.execute')
  @ApiOkResponse({ description: 'Excel (.xlsx) of the filtered registrations' })
  async export(@Query() query: ListRegistrationsQuery, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    const base = `${req.protocol}://${req.get('host')}`;
    const buffer = await this.registrations.exportXlsx(filterOf(query), base, req.auth!.userId, req.correlationId ?? 'unknown');
    const stamp = new Date().toISOString().slice(0, 10);
    res
      .status(200)
      .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .setHeader('Content-Disposition', `attachment; filename="nextgen-thi-sinh-${stamp}.xlsx"`)
      .setHeader('Cache-Control', 'no-store')
      .send(buffer);
  }

  @Get(':registrationId')
  @RequirePermission('candidate.read')
  detail(@Param('registrationId', ParseUUIDPipe) registrationId: string) {
    return this.registrations.detail(registrationId);
  }

  @Get(':registrationId/photo')
  @RequirePermission('media.view')
  photo(@Param('registrationId', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    return this.send(id, 'photo', req, res);
  }

  @Get(':registrationId/video')
  @RequirePermission('media.view')
  video(@Param('registrationId', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    return this.send(id, 'video', req, res);
  }

  /** Streams private media with HTTP Range support (video seeking); audits the first chunk only. */
  private async send(id: string, kind: 'photo' | 'video', req: AuthenticatedRequest, res: Response) {
    const file = await this.registrations.media(id, kind);
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.header('range') ?? '');
    let start = 0;
    let end = file.size - 1;
    if (range) {
      if (range[1]) start = Number(range[1]);
      if (range[2]) end = Math.min(Number(range[2]), file.size - 1);
      if (!range[1] && range[2]) start = Math.max(0, file.size - Number(range[2]));
      if (start > end || start >= file.size) {
        res.status(416).setHeader('Content-Range', `bytes */${file.size}`).end();
        return;
      }
    }
    if (start === 0) {
      await this.registrations.recordMediaView(req.auth!.userId, id, kind, req.correlationId ?? 'unknown');
    }
    res.status(range ? 206 : 200);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Length', String(end - start + 1));
    res.setHeader('Accept-Ranges', 'bytes');
    if (range) res.setHeader('Content-Range', `bytes ${start}-${end}/${file.size}`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (file.driveFileId) {
      const remote = await this.registrations.driveStream(file.driveFileId, start, end).catch(() => null);
      if (!remote?.body) {
        if (!res.headersSent) res.status(502).end();
        return;
      }
      const body = Readable.fromWeb(remote.body as import('node:stream/web').ReadableStream);
      body.on('error', () => res.destroy());
      body.pipe(res);
      return;
    }
    const stream = createReadStream(file.path!, { start, end });
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  }
}
