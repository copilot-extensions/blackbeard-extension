> [!NOTE]
> This is a fork modified to run on Cloudflare Workers.
> - js -> ts
> - npm -> pnpm

# blackbeard-extension

Blackbeard is a basic example of an agent-based GitHub Copilot Extension. It responds to messages like a pirate, using Copilot's LLM API and special system prompts. This repository should serve as an example of the building blocks of a Copilot Extension. See [index.ts](src/index.ts) for the main logic.

> [!NOTE]
> Copilot Extensions are in public preview and may be subject to change.
>
> All enrolled users with a GitHub Copilot Individual subscription can use Copilot Extensions.
> For organizations and enterprises with a Copilot Business or Copilot Enterprise subscription, organization owners and enterprise administrators can grant access to Copilot Extensions for use within their company.

## Development

Install dependencies:

```bash
pnpm install
```

To run for development:

```bash
pnpm dev
```

## Documentation
- [Using Copilot Extensions](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat)
- [About building Copilot Extensions](https://docs.github.com/en/copilot/building-copilot-extensions/about-building-copilot-extensions)
- [Set up process](https://docs.github.com/en/copilot/building-copilot-extensions/setting-up-copilot-extensions)
- [Communicating with the Copilot platform](https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension/configuring-your-copilot-agent-to-communicate-with-the-copilot-platform)
- [Communicating with GitHub](https://docs.github.com/en/copilot/building-copilot-extensions/building-a-copilot-agent-for-your-copilot-extension/configuring-your-copilot-agent-to-communicate-with-github)
