import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

async function callDeepSeek<T>(prompt: string, userContent: unknown): Promise<T> {
  const userMessageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: JSON.stringify(userContent),
    },
  ];

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-v4-flash',
    //@ts-ignore
    thinking: { type: 'disabled' },
    temperature: 0,
    response_format: {
      type: 'json_object',
    },
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: userMessageContent,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content ?? '{}');
}

export default {
  callDeepSeek,
};
