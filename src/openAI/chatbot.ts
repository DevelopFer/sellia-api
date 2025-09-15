import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export type ChatMessage = { 
  role: "system" | "user" | "assistant"; 
  content: string; 
};

export interface ChatCompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

@Injectable()
export class ChatbotService {
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("OpenAI API Key:", apiKey ? "Configured" : "Not Configured");
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey,
    });
  }

  /**
   * Generate a chat completion using OpenAI's API
   * @param messages Array of chat messages
   * @param options Optional configuration for the completion
   * @returns Promise with the assistant's response
   */
  async generateChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    try {
      const {
        model = process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        maxTokens = 512,
        temperature = 0.8
      } = options;

      if (!messages || messages.length === 0) {
        throw new Error('Messages array cannot be empty');
      }

      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      const assistantMessage = completion.choices?.[0]?.message?.content;
      
      if (!assistantMessage) {
        throw new Error('No response received from OpenAI');
      }

      return assistantMessage;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while generating chat completion');
    }
  }

  /**
   * Generate a simple chat response with a system prompt
   * @param userMessage The user's message
   * @param systemPrompt Optional system prompt (defaults to helpful assistant)
   * @param options Optional configuration
   * @returns Promise with the assistant's response
   */
  async generateSimpleResponse(
    userMessage: string,
    systemPrompt: string = "You are a helpful assistant.",
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ];

    return this.generateChatCompletion(messages, options);
  }

  /**
   * Continue a conversation with context
   * @param conversationHistory Array of previous messages
   * @param newUserMessage New message from user
   * @param options Optional configuration
   * @returns Promise with the assistant's response
   */
  async continueConversation(
    conversationHistory: ChatMessage[],
    newUserMessage: string,
    options: ChatCompletionOptions = {}
  ): Promise<string> {
    const messages: ChatMessage[] = [
      ...conversationHistory,
      { role: "user", content: newUserMessage }
    ];

    return this.generateChatCompletion(messages, options);
  }

  /**
   * Validate API key is configured
   * @returns boolean indicating if API key is available
   */
  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}
