import { Octokit } from "octokit";

Bun.serve({
  port: Bun.env.PORT ?? "3000",

  async fetch(request) {
    // Identify the user, using the GitHub API token provided in the request headers.
    const tokenForUser = request.headers.get("X-GitHub-Token");
    const octokit = new Octokit({ auth: tokenForUser });
    const user = await octokit.rest.users.getAuthenticated();
    console.log(`User: ${user.data.login}`);

    // Parse the request payload and log it.
    const payload = (await request.json()) as ExtensionRequestPayload;
    console.log(payload);

    // Insert a special pirate-y system message in our message list.
    const messages = payload.messages;
    messages.unshift({
      role: "system",
      content:
        "You are a helpful assistant that replies to user messages as if you were the Blackbeard Pirate.",
    });
    messages.unshift({
      role: "system",
      content: `Start every response with the user's name, which is @${user.data.login}`,
    });

    // Use Copilot's LLM to generate a response to the user's messages, with
    // our extra system messages attached.
    const copilotLLMResponse = await fetch(
      "https://api.githubcopilot.com/chat/completions",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${tokenForUser}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messages,
          stream: true,
        }),
      }
    );

    return new Response(copilotLLMResponse.body);
  },
});

interface ExtensionRequestPayload {
  messages: Array<{
    role: string;
    content: string;
    copilot_references?: Array<{
      type: string;
      data: any;
    }>;
  }>;
}
