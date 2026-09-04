import {
  Controller,
  Get,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { PublicService } from './public.service';
import { PublicCacheInterceptor } from './public-cache.interceptor';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

const FEATURED_PROJECT_EXAMPLE = {
  id: 3,
  title: 'Portfolio Manager',
  description: 'A portfolio CMS built with NestJS and Next.js.',
  repo_url: 'https://github.com/example/portfolio-manager',
  live_url: 'https://pm.jumadev.com',
  featured: true,
  category: { id: 1, category: 'Full Stack' },
  technologies: [{ id: 2, tech: 'TypeScript' }],
  f_images: { id: 9, src_path: 'uploads/42/cover.png' },
  created_at: '2026-06-01T00:00:00.000Z',
  updated_at: '2026-06-12T00:00:00.000Z',
};

@ApiTags('Public API')
@ApiSecurity('x-api-key')
@ApiUnauthorizedResponse({ description: 'Missing or invalid API key' })
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded' })
@Controller('public')
@UseGuards(ThrottlerGuard, ApiKeyGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('portfolio')
  @ApiOperation({
    summary: 'Get the full portfolio',
    description:
      "Returns the API-key owner's public portfolio: profile, active " +
      'projects, education, courses, experience and custom sections.',
  })
  @ApiOkResponse({
    description: 'The owner portfolio',
    schema: {
      example: {
        id: 42,
        username: 'johndoe',
        f_projects: [FEATURED_PROJECT_EXAMPLE],
        f_education: [],
        f_courses: [],
        f_experience: [],
        custom_sections: [],
      },
    },
  })
  @UseInterceptors(PublicCacheInterceptor)
  getPortfolio(@Req() req: Request & { apiKeyOwnerId: number }) {
    return this.publicService.getPortfolio(req.apiKeyOwnerId);
  }

  @Get('projects/featured')
  @ApiOperation({
    summary: 'List featured projects',
    description:
      "Returns only the API-key owner's active projects flagged as featured, " +
      'ordered by their manual order.',
  })
  @ApiOkResponse({
    description: 'Featured projects',
    schema: { type: 'array', items: { example: FEATURED_PROJECT_EXAMPLE } },
  })
  @UseInterceptors(PublicCacheInterceptor)
  getFeaturedProjects(@Req() req: Request & { apiKeyOwnerId: number }) {
    return this.publicService.getFeaturedProjects(req.apiKeyOwnerId);
  }
}
