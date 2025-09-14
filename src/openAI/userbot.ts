import { CreateMessageDto } from "src/messages/dto/create-message.dto";
import { UserconversationsService } from "src/userconversations/userconversations.service";
import { PrismaService } from '../prisma/prisma.service';
import { SocketGateway } from "src/socket/socket.gateway";
import { ChatbotService, ChatMessage } from "./chatbot";

// Define the complete User interface with isBot
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

        await this.prisma.message.create({
            data: newMessage
        });

        await this.prisma.conversation.update({
            where: { id: this.createMessageDto.conversationId },
            data: { updatedAt: new Date() }
        });

        this.socketGateway.emitNewMessage(this.createMessageDto.conversationId, newMessage);

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
        return "You are a conversational user-bot integrated into a chat demo. Your role is to always continue the conversation in a FRIENDLY, RESPECTFUL, and SAFE manner.\n\
            Rules:\n\
            Respond as if you were a human participant but limit references to personal data (do not invent personal information about the user).\n\
            Keep your tone cordial and brief when no further detail is needed; expand when it seems useful.\n\
            Do not provide dangerous instructions or facilitate illegal activities.\n\
            If the user requests a technical or sensitive instruction, respond with a warning and offer safe alternatives.\n\
            Adapt your level of detail to the user’s text (if the user writes briefly, respond briefly).\n\
            Do not fully mention that you are a \"bot\" (you may say things like “sure!” or “with pleasure” if appropriate), but acknowledge you are a demo assistant if explicitly asked.\n\n\
            When you receive the user’s latest message, respond while considering the conversation history (up to N previous messages).";
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
            take: 10 // Get last 10 messages for context
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
            
            // Fallback to simple responses if AI fails
            const fallbackResponses = [
                "I'm here to help! How can I assist you?",
                "That's interesting! Tell me more.",
                "I understand. Is there anything specific you'd like to know?",
                "Thanks for sharing that with me.",
                "I'm listening. Please continue."
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
    }};