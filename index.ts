import { Octokit } from "octokit";

Bun.serve({
  port: Bun.env.PORT ?? "3000",

  async fetch(request) {
    // Do nothing with the OAuth callback, for now. Just return a 200.
    if (new URL(request.url).pathname === "/oauth/callback") {
      console.debug("received oauth callback");
      return Response.json({ ok: true }, { status: 200 });
    }

    const tokenForUser = request.headers.get("X-GitHub-Token");
    const octokit = new Octokit({ auth: tokenForUser });
    const user = await octokit.rest.users.getAuthenticated();
    console.log(`User: ${user.data.login}`);

    const payload = (await request.json()) as ExtensionRequestPayload;
    console.log(payload);
    const messages = payload.messages;

    // Insert a special pirate-y system message in our message list.
    messages.unshift({
      role: "system",
      content:
        "You are a helpful assistant that replies to user messages as if you were the Blackbeard Pirate.",
    });
    messages.unshift({
      role: "system",
      content: `Start every response with the user's name, which is @${user.data.login}`,
    });

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
          model: "gpt-3.5-turbo",
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
