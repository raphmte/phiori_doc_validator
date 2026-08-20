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
    max_tokens: 8192,
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

  const choice = response.choices[0];
  const content = choice.message.content ?? '{}';

  try {
    return JSON.parse(content);
  } catch (e) {
    // finish_reason "length" = resposta cortada por bater no max_tokens no meio do JSON (JSON.parse
    // dá "Unterminated string" nesse caso, sem indicar a causa) — logamos aqui pra diferenciar de
    // um JSON realmente malformado devolvido pelo modelo.
    console.error(
      `DeepSeekHelper: resposta não é um JSON válido (finish_reason: ${choice.finish_reason})`,
      content,
    );
    throw e;
  }
}

export default {
  callDeepSeek,
};
