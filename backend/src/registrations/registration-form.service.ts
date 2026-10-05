import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../config/configuration';

export type ConsentPurpose = 'DATA_PROCESSING' | 'MEDIA_USAGE' | 'EVENT_COVERAGE';

/** Current wording versions; the DB stores whatever version the candidate actually saw. */
export const CURRENT_WORDING_VERSIONS: Record<ConsentPurpose, string> = {
  DATA_PROCESSING: 'DATA-V1-2026',
  MEDIA_USAGE: 'MEDIA-V1-2026',
  EVENT_COVERAGE: 'EVENT-V1-2026',
};

/**
 * Server-driven form copy for the public registration form (FR-13 + PR media).
 * The frontend renders exactly these statements, so wording stays in one place.
 */
@Injectable()
export class RegistrationFormService {
  constructor(private readonly config: ConfigService<AppConfig>) {}

  getFormConfig() {
    const contactEmail = this.config.getOrThrow('contactEmail');
    return {
      video: {
        maxBytes: this.config.getOrThrow('uploadMaxBytes'),
        maxDurationSeconds: this.config.getOrThrow('videoMaxDurationSeconds'),
        acceptedType: 'video/mp4',
      },
      photo: {
        maxBytes: this.config.getOrThrow('photoMaxBytes'),
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        statement:
          '01 bức ảnh cá nhân dùng cho hoạt động truyền thông của Cuộc thi.',
      },
      consents: {
        eventCoverage: {
          wordingVersion: CURRENT_WORDING_VERSIONS.EVENT_COVERAGE,
          statement:
            'Ban Tổ chức ghi hình, chụp ảnh tại các vòng thi và sự kiện của Cuộc thi, sử dụng cho mục đích truyền thông về Cuộc thi trên fanpage, website, ấn phẩm in và báo chí. Hình ảnh được lưu trong 01 năm kể từ ngày kết thúc Cuộc thi.',
          required: true,
        },
        mediaUsage: {
          wordingVersion: CURRENT_WORDING_VERSIONS.MEDIA_USAGE,
          statement:
            'Tôi đồng ý cho Ban Tổ chức sử dụng hình ảnh, video của tôi cho mục đích truyền thông nêu trên.',
          declineStatement: 'Tôi không đồng ý.',
          withdrawalNotice: `Bạn có thể rút lại sự đồng ý bất cứ lúc nào bằng cách gửi email tới ${contactEmail}.`,
          required: false,
        },
      },
      favoriteCandidateNotice:
        'Đối với thí sinh tham gia xét giải Thí sinh được yêu thích nhất, thí sinh phải đồng ý sử dụng hình ảnh và video.',
    };
  }
}
