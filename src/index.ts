import { Hono } from 'hono';
import { Octokit } from '@octokit/core';

const app = new Hono();

app.post('/', async (c) => {
	const tokenForUser = c.req.header('X-GitHub-Token');
	if (!tokenForUser) {
		return c.text('GitHub token is required', 400);
	}

	const octokit = new Octokit({ auth: tokenForUser });
	const payload = await c.req.json<{ messages?: any[] }>();

	try {
		const user = await octokit.request('GET /user');
		const username = user.data.login;
		console.log('User:', username);

		const messages = payload.messages || [];
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

		const model = 'gpt-4o';
		const requestBody = {
			messages,
			model,
			stream: true,
		};

		const copilotLLMResponse = await fetch('https://api.githubcopilot.com/chat/completions', {
			method: 'POST',
			headers: {
				authorization: `Bearer ${tokenForUser}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});

		if (!copilotLLMResponse.body) {
			throw new Error('No response body from Copilot API');
		}

		return new Response(copilotLLMResponse.body, {
			headers: { 'Content-Type': 'application/json' },
		});
	} catch (error) {
		console.error('Error:', error);
		return c.text(`Error: ${(error as Error).message}`, 500);
	}
});

export default app;
