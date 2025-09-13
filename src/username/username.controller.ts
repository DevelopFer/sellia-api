import { Controller, Get, Param } from '@nestjs/common';
import { UsernameService } from './username.service';

@Controller('username')
export class UsernameController {

    constructor(private readonly usernameService: UsernameService) {}

    @Get(':username/taken')
    async isUsernameTaken(@Param('username') username: string): Promise<{ taken: boolean }> {
        const taken = await this.usernameService.isUsernameTaken(username);
        return { taken };
    }
}
