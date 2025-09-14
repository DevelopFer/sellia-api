import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

// Define a complete User interface that includes all fields
interface CompleteUser {
    id: string;
    username: string;
    name: string | null;
    isOnline: boolean;
    isBot: boolean;
    createdAt: Date;
    updatedAt: Date;
}


@Injectable()
export class UserconversationsService {
    constructor(private prisma: PrismaService) {}

    async getParticipants(conversationId: string): Promise<User[]>{
        try {
            const userConversations = await this.prisma.userConversation.findMany({
                where: { 
                    conversationId: conversationId 
                },
                include:{
                    user:true
                },
                orderBy:{
                    user:{
                        createdAt:'desc'
                    },
                }
            });

            if(!userConversations){
                throw new Error(`User conversations with ID ${conversationId} not found`);
            }

            return userConversations.map(uc => uc.user);

        } catch (error) {
            console.error("Error fetching participants:", error);
            throw error;
        }
    }

    async getAnotherParticipant(
        conversationId: string,
        userId: string
    ): Promise<CompleteUser>{
        try {
            const participant = await this.prisma.userConversation.findFirst({
                where: { 
                    conversationId: conversationId,
                    NOT: { userId: userId }
                },
                include:{
                    user:true
                },
            });

            if(!participant){
                throw new Error(`User participant with ID ${conversationId} not found`);
            }

            
            const user: CompleteUser = participant.user as CompleteUser;
            return user;

        } catch (error) {
            console.error("Error fetching participant:", error);
            throw error;
        }
    }

}
