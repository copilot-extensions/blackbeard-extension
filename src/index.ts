import { Octokit } from '@octokit/core';

/**
 * Cloudflare Workers entry point
 */
export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Parse the request
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}

		// Identify the user, using the GitHub API token provided in the request headers.
		const tokenForUser = request.headers.get('X-GitHub-Token');
		if (!tokenForUser) {
			return new Response('GitHub token is required', { status: 400 });
		}

		const octokit = new Octokit({ auth: tokenForUser });
		const payload = (await request.json()) as { messages?: any[] };

		try {
			// Identify the user using GitHub API
			const user = await octokit.request('GET /user');
			const username = user.data.login;
			console.log('User:', username);

			// Insert a special pirate-y system message in our message list.
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

			// Use Copilot's LLM to generate a response to the user's messages, with
			// our extra system messages attached.
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

			// Stream the response straight back to the user.
			return new Response(copilotLLMResponse.body, {
				headers: { 'Content-Type': 'application/json' },
			});
		} catch (error) {
			console.error('Error:', error);
			return new Response(`Error: ${(error as Error).message}`, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
