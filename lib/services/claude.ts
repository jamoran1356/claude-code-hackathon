import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PromptEvaluation {
  score: number;
  reason: string;
  strengths: string[];
  improvements: string[];
}

/**
 * Evaluate prompt quality using Claude
 */
export async function evaluatePromptWithClaude(
  title: string,
  description: string
): Promise<PromptEvaluation> {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Evaluate this AI prompt on a scale of 1-100. Respond in JSON format.

Title: "${title}"
Description: "${description}"

Respond with ONLY valid JSON (no markdown):
{
  "score": <number 1-100>,
  "reason": "<one sentence>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"]
}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const evaluation = JSON.parse(content.text) as PromptEvaluation;

    // Validate
    if (!evaluation.score || evaluation.score < 1 || evaluation.score > 100) {
      evaluation.score = 50;
    }

    return evaluation;
  } catch (error) {
    console.error('Claude evaluation failed:', error);
    // Return default evaluation on error
    return {
      score: 50,
      reason: 'Default evaluation',
      strengths: ['Readable'],
      improvements: ['Could be more specific'],
    };
  }
}

/**
 * Generate hybrid prompt description
 */
export async function generateHybridDescription(
  parent1Title: string,
  parent1Description: string,
  parent2Title: string,
  parent2Description: string
): Promise<string> {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Create a hybrid prompt that combines these two:

Parent 1:
Title: "${parent1Title}"
Description: "${parent1Description}"

Parent 2:
Title: "${parent2Title}"
Description: "${parent2Description}"

Provide a new prompt description that blends the best aspects of both. Keep it under 500 characters.`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return content.text;
  } catch (error) {
    console.error('Hybrid generation failed:', error);
    return `Hybrid of ${parent1Title} and ${parent2Title}`;
  }
}
