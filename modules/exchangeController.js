import jwt from 'jsonwebtoken';
import { getSigningKey, isValidJWT } from './oidcHelper.js';
import { logger } from './logger.js';

/**
 * @description Handles the token exchange request.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export async function handleTokenExchange(req, res) {

    logger.info("Received token exchange request at endpoint '/exchange' (OIDC flow)");

    try {
        // Log the request headers
        logger.debug("Request Headers '/exchange': " + JSON.stringify(req.headers, null, 2));

        // Parse the request body for token exchange parameters
        const { subject_token, subject_token_type, grant_type } = req.body;

        logger.debug("Validating token exchange request payload requirements");

        // Validate the grant type
        logger.debug("Validating grant_type: " + grant_type);
        if (grant_type !== "urn:ietf:params:oauth:grant-type:token-exchange") {
            logger.error("Unsupported grant type: " + grant_type);
            return res.status(400).json({
                error: "unsupported_grant_type",
                error_description: "Only token exchange is supported",
            });
        }

        // Validate the subject token type
        logger.debug("Validating subject_token_type: " + subject_token_type);
        if (subject_token_type !== "urn:ietf:params:oauth:token-type:id_token") {
            logger.error("Unsupported subject_token_type: " + subject_token_type);
            return res.status(400).json({
                error: "unsupported_token_type",
                error_description: "Only access tokens are supported as subject_token_type",
            });
        }

        if (!subject_token || !subject_token_type || !grant_type) {
            logger.error("Invalid token exchange request payload: " + req.body);
            return res.status(400).json({ error: "invalid_request", error_description: "Missing required parameters" });
        }

        logger.info("Fetching signing key for token verification ('https://github.com/login/oauth/.well-known/jwks.json')");
        const signingKey = await getSigningKey(req.headers);

        logger.info("Verifying token signature, using signing key");
        logger.debug("Token to verify: \n" + subject_token);
        try {
            const payload = jwt.verify(subject_token, signingKey, {
                algorithms: ["RS256"], // Specify the algorithm used to sign the token
            });
            logger.debug("Token Payload: " + JSON.stringify(payload, null, 2));

            await isValidJWT(payload);
            logger.info("JWT is valid");

        } catch (error) {
            logger.error("JWT verification failed: " + error.message);
            return res.status(400).json({ "error": "invalid_request" });
        }

        // -------------------------------------------------
        // Insert your access_token generation logic here
        // -------------------------------------------------

        // const exchangedToken = {
        //     access_token: "newly_exchanged_token_value", // Replace with actual token generation logic
        //     token_type: "Bearer",
        //     expires_in: 120, // Token expiration time in seconds
        //     scope: "read write", // Adjust the scope as needed
        // };
        const exchangedToken = {
            "access_token": "newly_exchanged_token_value", // Replace with actual generated token 
            "Issued_token_type":"urn:ietf:params:oauth:token-type:access_token",
            "token_type": "Bearer",
            "expires_in": 120
          }

        logger.debug("Exchanged Token: " + JSON.stringify(exchangedToken));
        logger.info("Token exchange successful");

        // Respond with the exchanged token
        return res.status(200).json(exchangedToken);
    } catch (error) {
        logger.error("Internal server error during token exchange: " + error);
        return res.status(500).json({ "error": "invalid_request" });
    }
}