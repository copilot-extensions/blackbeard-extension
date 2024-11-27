import { Context } from 'hono';
import { Octokit } from '@octokit/core';
import OpenAI from 'openai';

export const handlePost = async (c: Context) => {
	const tokenForUser = c.req.header('X-GitHub-Token');
	if (!tokenForUser) {
		return c.text('GitHub token is required', 400);
	}

	const octokit = new Octokit({ auth: tokenForUser });
	const body = await c.req.json();
	const messages = body.messages || [];

	try {
		const user = await octokit.request('GET /user');
		const username = user.data.login;
		console.log('User:', username);

		const baseUrl = 'https://api.githubcopilot.com';
		const openai = new OpenAI({
			baseURL: baseUrl,
			apiKey: tokenForUser,
		});

		messages.unshift(
			{
				role: 'system',
				content: 'You are a helpful assistant that replies to user messages as if you were the Blackbeard Pirate.',
			},
			{
				role: 'system',
				content: `Start every response with the user's name, which is @${username}`,
			},
		);

		const stream = await openai.chat.completions.create({
			messages: messages,
			model: 'gpt-4o',
			stream: true,
		});

		const encoder = new TextEncoder();
		const readableStream = new ReadableStream({
			async start(controller) {
				for await (const chunk of stream) {
					if (chunk.choices?.[0]?.finish_reason === 'stop') {
						console.log('Stream completed.');
						controller.close();
						break;
					}

					const data = JSON.stringify(chunk);
					const payload = `data: ${data}\n\n`;
					controller.enqueue(encoder.encode(payload));
				}
				controller.close();
			},
		});

		return new Response(readableStream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		});
	} catch (error) {
		console.error('Error:', error);
		return c.text(`Error: ${(error as Error).message}`, 500);
	}
};
