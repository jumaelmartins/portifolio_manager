import type { Request } from 'express';
import { PublicController } from './public.controller';

describe('PublicController', () => {
  const publicService = {
    getPortfolio: jest.fn(),
    getFeaturedProjects: jest.fn(),
  };
  let controller: PublicController;

  const request = { apiKeyOwnerId: 42 } as Request & {
    apiKeyOwnerId: number;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new PublicController(publicService as never);
  });

  it('returns the portfolio of the api key owner', () => {
    controller.getPortfolio(request);

    expect(publicService.getPortfolio).toHaveBeenCalledWith(42);
  });

  it('returns the featured projects of the api key owner', () => {
    controller.getFeaturedProjects(request);

    expect(publicService.getFeaturedProjects).toHaveBeenCalledWith(42);
  });
});
