import { Test, TestingModule } from '@nestjs/testing';
import { UserconversationsService } from './userconversations.service';

describe('UserconversationsService', () => {
  let service: UserconversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserconversationsService],
    }).compile();

    service = module.get<UserconversationsService>(UserconversationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
