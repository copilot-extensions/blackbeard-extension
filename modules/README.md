# OIDC Support Modules
>*GitHub Docs Reference: [Using OIDC with GitHub Copilot Extensions](https://docs.github.com/en/copilot/building-copilot-extensions/using-oidc-with-github-copilot-extensions)*

This folder contains key OIDC support modules used in the **Blackbeard Extension** project. Below is an overview of the primary files and their functionality:

## Files Overview

### 1. `oidcHelper.js`
This module provides helper functions for handling OpenID Connect (OIDC) token validation and signing key retrieval. It is designed to work with GitHub's OIDC tokens.

#### Key Functions:
- **`getSigningKey(header)`**  
  Retrieves the public signing key from GitHub's JWKS URI to validate tokens.  
  - *Parameters:*  
    - `header`: The JWT header containing the `kid` (key ID).  
  - *Returns:*  
    - The public signing key for verifying JWTs.

- **`isValidJWT(payload)`**  
  Validates the payload of a decoded JWT against a set of rules, including `aud` (audience), `sub` (subject), `iat` (issued at), and more.  
  - *Parameters:*  
    - `payload`: Decoded JWT payload.  
  - *Returns:*  
    - `true` if the JWT payload is valid. Throws an error otherwise.

#### Dependencies:
- `jwks-rsa`: For fetching signing keys from GitHub's JWKS URI.
- `dotenv`: For loading environment variables.

---

### 2. `exchangeController.js`
This module implements the main logic for handling token exchange requests using the OAuth 2.0 Token Exchange flow. It validates incoming requests and generates new tokens based on the provided `subject_token`.

#### Key Function:
- **`handleTokenExchange(req, res)`**  
  Handles token exchange requests at the `/exchange` endpoint.  
  - *Parameters:*  
    - `req`: Express request object containing the token exchange payload.
    - `res`: Express response object for sending the response.  
  - *Process:*  
    1. Validates `grant_type` and `subject_token_type`.
    2. Verifies the `subject_token` using `oidcHelper.js` methods.
    3. Generates a new access token (stub logic included for customization).
    4. Returns the new token in the response.

#### Response Example:
```json
{
  "access_token": "newly_exchanged_token_value", // Replace with actual generated token 
  "Issued_token_type":"urn:ietf:params:oauth:token-type:access_token",
  "token_type": "Bearer",
  "expires_in": 120
}