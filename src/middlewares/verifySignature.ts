import { Context, Next } from 'hono';
import { fromBER } from 'asn1js';
import { Sequence, Integer } from 'asn1js';

interface GitHubKeysPayload {
	public_keys: Array<{
		key: string;
		key_identifier: string;
		is_current: boolean;
	}>;
}

const GITHUB_KEYS_URI = 'https://api.github.com/meta/public_keys/copilot_api';

function padStart(data: Uint8Array, totalLength: number): Uint8Array {
	if (data.length === totalLength) return data;
	if (data.length > totalLength) {
		if (data.length === totalLength + 1 && data[0] === 0) {
			return data.slice(1);
		}
		throw new Error('Invalid data length for ECDSA signature component');
	}
	const result = new Uint8Array(totalLength);
	result.set(data, totalLength - data.length);
	return result;
}

function parseASN1Signature(signatureBuffer: Uint8Array): Uint8Array {
	const asn1 = fromBER(signatureBuffer.buffer);
	if (asn1.offset === -1) {
		throw new Error('Failed to parse signature');
	}
	const sequence = asn1.result as Sequence;
	if (!sequence.valueBlock || sequence.valueBlock.value.length !== 2) {
		throw new Error('Invalid signature structure');
	}
	const rInteger = sequence.valueBlock.value[0] as Integer;
	const sInteger = sequence.valueBlock.value[1] as Integer;
	const rArray = new Uint8Array(rInteger.valueBlock.valueHexView);
	const sArray = new Uint8Array(sInteger.valueBlock.valueHexView);
	const paddedR = padStart(rArray, 32);
	const paddedS = padStart(sArray, 32);
	const rawSignature = new Uint8Array(64);
	rawSignature.set(paddedR, 0);
	rawSignature.set(paddedS, 32);
	return rawSignature;
}

type MiddlewareReturn = Promise<Response | void>;
export const verifySignature = async (c: Context, next: Next): MiddlewareReturn => {
	const signature = c.req.header('Github-Public-Key-Signature');
	const keyId = c.req.header('Github-Public-Key-Identifier');
	const tokenForUser = c.req.header('X-GitHub-Token');

	if (!signature || !keyId) {
		c.status(400);
		return c.text('Missing signature headers');
	}

	const body = await c.req.text();

	try {
		const headers: HeadersInit = {
			'User-Agent': 'Your-App-Name/0.0.1',
			...(tokenForUser && { Authorization: `Bearer ${tokenForUser}` }),
		};

		const response = await fetch(GITHUB_KEYS_URI, { headers });
		if (!response.ok) {
			c.status(500);
			return c.text('Failed to fetch public keys');
		}

		const keys: GitHubKeysPayload = await response.json();
		const publicKeyEntry = keys.public_keys.find((key) => key.key_identifier === keyId);
		if (!publicKeyEntry) {
			c.status(401);
			return c.text('No matching public key found');
		}

		const pemToArrayBuffer = (pem: string): ArrayBuffer => {
			const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
			const binary = atob(b64);
			const buffer = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				buffer[i] = binary.charCodeAt(i);
			}
			return buffer.buffer;
		};

		const publicKeyBuffer = pemToArrayBuffer(publicKeyEntry.key);
		const cryptoKey = await crypto.subtle.importKey('spki', publicKeyBuffer, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);

		const signatureBuffer = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
		const rawSignature = parseASN1Signature(signatureBuffer);
		const encoder = new TextEncoder();
		const payloadBuffer = encoder.encode(body);

		const isValid = await crypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } }, cryptoKey, rawSignature, payloadBuffer);

		if (!isValid) {
			console.error('Invalid signature');
			return c.text('Invalid signature', 401);
		}
		console.log('Signature verified');
		await next();
	} catch (error) {
		console.error('Signature verification error:', error);
		return c.text('Signature verification failed', 500);
	}
};
