import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsernameService {

    constructor(private prisma: PrismaService) {}

    async isUsernameTaken(username: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });
        return !!user;
    }

}
