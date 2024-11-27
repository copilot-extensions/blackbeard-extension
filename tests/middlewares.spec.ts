import { describe, it, expect, vi } from 'vitest';
import { verifySignature } from '../src/middlewares/verifySignature';

describe('verifySignature Middleware', () => {
	it('should validate a correct signature', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve({
						public_keys: [
							{
								key: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAESoI7WDsjrZoGd17IYbShsmKmrXHA
xvfUtZcxp+om0eqjBAKW3fR7VX4FIEBx3ZdPp/1RhlWpstemU8QbMw4q8A==
-----END PUBLIC KEY-----`,
								key_identifier: 'valid-key-id',
								is_current: true,
							},
						],
					}),
			}),
		) as any;

		const ctx = {
			req: {
				header: (name: string) =>
					name === 'Github-Public-Key-Identifier'
						? 'valid-key-id'
						: 'MEUCIHZFT7AX2Sz6nWhjQ6r43teOmrkaxpLfEnv2hX4o8RQgAiEA++YJBgSYl6kHttOXP/uxb/qlpEs4tw6NNgFsKIyTWSI=',
				text: () => Promise.resolve('payload'),
			},
			status: vi.fn(),
			text: vi.fn(),
		} as any;

		const next = vi.fn();
		await verifySignature(ctx, next);

		expect(next).toHaveBeenCalled();
	});

	it('should fail with an invalid signature', async () => {
		global.fetch = vi.fn(() =>
			Promise.resolve({
				ok: true,
				json: () =>
					Promise.resolve({
						public_keys: [
							{
								key: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAESoI7WDsjrZoGd17IYbShsmKmrXHA
xvfUtZcxp+om0eqjBAKW3fR7VX4FIEBx3ZdPp/1RhlWpstemU8QbMw4q8A==
-----END PUBLIC KEY-----`,
								key_identifier: 'valid-key-id',
								is_current: true,
							},
						],
					}),
			}),
		) as any;

		const ctx = {
			req: {
				header: (name: string) => (name === 'Github-Public-Key-Identifier' ? 'invalid-key-id' : 'INVALID_SIGNATURE'),
				text: () => Promise.resolve('payload'),
			},
			status: vi.fn(),
			text: vi.fn(),
		} as any;

		const next = vi.fn();
		await verifySignature(ctx, next);

		expect(ctx.status).toHaveBeenCalledWith(401);
		expect(ctx.text).toHaveBeenCalledWith('No matching public key found');
		expect(next).not.toHaveBeenCalled();
	});
});
