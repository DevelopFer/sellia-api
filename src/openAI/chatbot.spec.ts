import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { ChatbotService, ChatMessage, ChatCompletionOptions } from './chatbot';
import OpenAI from 'openai';


vi.mock('openai');

describe('ChatbotService', () => {
  let service: ChatbotService;
  let mockOpenAI: any;
  let mockCreate: MockedFunction<any>;

  const originalEnv = process.env;

  beforeEach(async () => {

    vi.resetModules();
    process.env = { ...originalEnv };


    process.env.OPENAI_API_KEY = 'test-api-key';
    process.env.OPENAI_MODEL = 'gpt-4o-mini';


    mockCreate = vi.fn();
    mockOpenAI = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };

    
    vi.mocked(OpenAI).mockImplementation(() => mockOpenAI);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatbotService],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw error when OPENAI_API_KEY is not set', () => {
      delete process.env.OPENAI_API_KEY;
      
      expect(() => new ChatbotService()).toThrow(
        'OPENAI_API_KEY environment variable is required'
      );
    });

    it('should initialize OpenAI client with API key', () => {
      new ChatbotService();
      
      expect(OpenAI).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
    });
  });

  describe('generateChatCompletion', () => {
    const mockMessages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' },
    ];

    const mockResponse = {
      choices: [
        {
          message: {
            content: 'Hello! I am doing well, thank you for asking.',
          },
        },
      ],
    };

    it('should generate chat completion successfully', async () => {
      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await service.generateChatCompletion(mockMessages);

      expect(result).toBe('Hello! I am doing well, thank you for asking.');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: mockMessages,
        max_tokens: 512,
        temperature: 0.8,
      });
    });

    it('should use custom options when provided', async () => {
      mockCreate.mockResolvedValue(mockResponse as any);

      const options: ChatCompletionOptions = {
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.5,
      };

      await service.generateChatCompletion(mockMessages, options);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: mockMessages,
        max_tokens: 1000,
        temperature: 0.5,
      });
    });

    it('should throw error when messages array is empty', async () => {
      await expect(service.generateChatCompletion([])).rejects.toThrow(
        'Messages array cannot be empty'
      );
    });

    it('should throw error when no response is received', async () => {
      mockCreate.mockResolvedValue({ choices: [] } as any);

      await expect(service.generateChatCompletion(mockMessages)).rejects.toThrow(
        'No response received from OpenAI'
      );
    });

    it('should throw error when OpenAI API call fails', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(service.generateChatCompletion(mockMessages)).rejects.toThrow(
        'OpenAI API error: API rate limit exceeded'
      );
    });

    it('should handle unknown errors', async () => {
      mockCreate.mockRejectedValue('Unknown error');

      await expect(service.generateChatCompletion(mockMessages)).rejects.toThrow(
        'Unknown error occurred while generating chat completion'
      );
    });
  });

  describe('generateSimpleResponse', () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'This is a simple response.',
          },
        },
      ],
    };

    it('should generate simple response with default system prompt', async () => {
      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await service.generateSimpleResponse('Hello!');

      expect(result).toBe('This is a simple response.');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello!' },
        ],
        max_tokens: 512,
        temperature: 0.8,
      });
    });

    it('should generate simple response with custom system prompt', async () => {
      mockCreate.mockResolvedValue(mockResponse as any);

      const customPrompt = 'You are a coding assistant.';
      await service.generateSimpleResponse('Help me code', customPrompt);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: customPrompt },
          { role: 'user', content: 'Help me code' },
        ],
        max_tokens: 512,
        temperature: 0.8,
      });
    });

    it('should pass options to generateChatCompletion', async () => {
      mockCreate.mockResolvedValue(mockResponse as any);

      const options: ChatCompletionOptions = {
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
      };

      await service.generateSimpleResponse('Hello!', undefined, options);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello!' },
        ],
        max_tokens: 512,
        temperature: 0.3,
      });
    });
  });

  describe('continueConversation', () => {
    const mockConversationHistory: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the weather like?' },
      { role: 'assistant', content: 'I cannot check real-time weather data.' },
    ];

    const mockResponse = {
      choices: [
        {
          message: {
            content: 'Is there anything else I can help you with?',
          },
        },
      ],
    };

    it('should continue conversation with history', async () => {
      mockCreate.mockResolvedValue(mockResponse as any);

      const result = await service.continueConversation(
        mockConversationHistory,
        'Thank you for letting me know'
      );

      expect(result).toBe('Is there anything else I can help you with?');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          ...mockConversationHistory,
          { role: 'user', content: 'Thank you for letting me know' },
        ],
        max_tokens: 512,
        temperature: 0.8,
      });
    });

    it('should handle empty conversation history', async () => {
      mockCreate.mockResolvedValue(mockResponse as any);

      await service.continueConversation([], 'Hello');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 512,
        temperature: 0.8,
      });
    });

    it('should apply custom options', async () => {
      mockCreate.mockResolvedValue(mockResponse as any);

      const options: ChatCompletionOptions = {
        maxTokens: 200,
        temperature: 1.0,
      };

      await service.continueConversation(
        mockConversationHistory,
        'Continue please',
        options
      );

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          ...mockConversationHistory,
          { role: 'user', content: 'Continue please' },
        ],
        max_tokens: 200,
        temperature: 1.0,
      });
    });
  });

  describe('isConfigured', () => {
    it('should return true when API key is set', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      
      expect(service.isConfigured()).toBe(true);
    });

    it('should return false when API key is not set', () => {
      delete process.env.OPENAI_API_KEY;
      
      expect(service.isConfigured()).toBe(false);
    });

    it('should return false when API key is empty string', () => {
      process.env.OPENAI_API_KEY = '';
      
      expect(service.isConfigured()).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle conversation flow from start to finish', async () => {
      const responses = [
        { choices: [{ message: { content: 'Hello! How can I help you?' } }] },
        { choices: [{ message: { content: 'Sure, I can help with that!' } }] },
        { choices: [{ message: { content: 'You are welcome!' } }] },
      ];

      mockCreate
        .mockResolvedValueOnce(responses[0] as any)
        .mockResolvedValueOnce(responses[1] as any)
        .mockResolvedValueOnce(responses[2] as any);


      const response1 = await service.generateSimpleResponse('Hello');
      expect(response1).toBe('Hello! How can I help you?');

      
      let history: ChatMessage[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: response1 },
      ];

      const response2 = await service.continueConversation(
        history,
        'Can you help me with coding?'
      );
      expect(response2).toBe('Sure, I can help with that!');

      
      history = [
        ...history,
        { role: 'user', content: 'Can you help me with coding?' },
        { role: 'assistant', content: response2 },
      ];

      const response3 = await service.continueConversation(history, 'Thank you!');
      expect(response3).toBe('You are welcome!');

      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });
});