import { CreateMessageDto } from "src/messages/dto/create-message.dto";
import { UserconversationsService } from "src/userconversations/userconversations.service";
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from "src/socket/socket.gateway";
import { ChatbotService, ChatMessage } from "./chatbot";


interface CompleteUser {
    id: string;
    username: string;
    name: string | null;
    isOnline: boolean;
    isBot: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export default class UserBot {

    private botParticipant: CompleteUser | null = null;

    private createMessageDto: CreateMessageDto;
    public constructor(
        createMessageDto: CreateMessageDto,
        private userConversationsService: UserconversationsService,
        private prisma: PrismaService,
        private socketGateway: SocketGateway,
        private chatbotService: ChatbotService
    ){
        console.log("UserBot initialized");
        this.createMessageDto = createMessageDto;
        this.prisma = prisma;
        this.socketGateway = socketGateway;
    }

    public async replyToMessage(): Promise<void>{
        await this.conversationHasBotParticipant();
        if( !this.botParticipant ){
            console.log("No bot participant in conversation, not replying.");
            return;
        }
        
        console.log("Bot participant found, preparing to reply...");
        const newMessage = await this.keepTheConversationGoing();
        console.log("Generated bot reply:", newMessage);

        if(!newMessage){
            console.log("No message generated, aborting.");
            return;
        }

        const botMessage = await this.prisma.message.create({
            data: newMessage
        });

        console.log("Bot message created:", botMessage);

        await this.prisma.conversation.update({
            where: { id: this.createMessageDto.conversationId },
            data: { updatedAt: new Date() }
        });

        this.socketGateway.emitNewMessage(this.createMessageDto.conversationId, botMessage);

    }

    private async conversationHasBotParticipant(): Promise<this> {
        const otherParticipant: CompleteUser = await this.userConversationsService.getAnotherParticipant(
            this.createMessageDto.conversationId,
            this.createMessageDto.senderId
        );
        this.botParticipant = otherParticipant.isBot ? otherParticipant : null;
        return this;
    }

    private getChatbotPrompt(): string {
        const botName = this.botParticipant?.name || this.botParticipant?.username || 'Assistant';
        const botUsername = this.botParticipant?.username || '';
        
        return `You are ${botName} (${botUsername}), a famous character/celebrity participating in this chat conversation. Your role is to respond authentically as this character while being FRIENDLY, RESPECTFUL, and SAFE.
        Character Identity Rules:
        - Always stay in character as ${botName}
        - Use the personality, mannerisms, and speaking style that ${botName} is known for
        - Reference your character's background, experiences, and relationships when relevant
        - If you're a superhero character, you can reference your powers, missions, and alter ego when appropriate
        - If you're another type of celebrity, reference your profession, achievements, or known traits
        - Keep responses authentic to your character while maintaining a conversational tone
        Conversation Rules:
        - Respond as if you were the actual ${botName} participating in a chat
        - Keep your tone consistent with your character but friendly and engaging
        - Adapt your level of detail to match the user's message length
        - Do not break character or mention that you are an AI/bot
        - If asked directly about being AI, stay in character and respond as the celebrity would
        - Do not provide dangerous instructions or facilitate illegal activities
        - Keep the conversation appropriate and safe
        Remember: You are ${botName}, not an assistant. Respond as this character would in a casual chat conversation.`;
    }

    private async getLatestConversationMessages(){
        const conversationMessages = await this.prisma.message.findMany({
            where: {
                conversationId: this.createMessageDto.conversationId
            },
            include: {
                sender: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        conversationMessages.reverse();

        return  conversationMessages.map(msg => ({
            role: (msg.sender as CompleteUser).isBot ? "assistant" : "user",
            content: msg.content
        })) as ChatMessage[];
    }

    private async keepTheConversationGoing(): Promise<CreateMessageDto> {
        
        try {
            const chatHistory = await this.getLatestConversationMessages();
            const systemPrompt = this.getChatbotPrompt();

            const messages: ChatMessage[] = [
                { role: "system", content: systemPrompt },
                ...chatHistory
            ];

            const aiResponse = await this.chatbotService.generateChatCompletion(messages, {
                maxTokens: 150,
                temperature: 0.8
            });

            console.log("AI Response:", aiResponse);

            const response: CreateMessageDto = {
                conversationId: this.createMessageDto.conversationId,
                senderId: this.botParticipant!.id,
                content: aiResponse,
                messageType: "text"
            };

            return response;

        } catch (error) {
            
            console.error("Error generating AI response:", error);

            /** Fallback to character-specific responses if AI fails */
            const botName = this.botParticipant?.name || this.botParticipant?.username || 'Assistant';
            const fallbackResponses = [
                `As ${botName}, I'm here to continue our conversation! What would you like to discuss?`,
                `Interesting! Tell me more about that.`,
                `I understand. Is there anything specific you'd like to know about my experiences?`,
                `Thanks for sharing that with me. What's on your mind?`,
                `I'm listening. Please continue - this is fascinating!`
            ];
            
            const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

            const response: CreateMessageDto = {
                conversationId: this.createMessageDto.conversationId,
                senderId: this.botParticipant!.id,
                content: fallbackResponse,
                messageType: "text"
            };

            return response;
        }
    }
}