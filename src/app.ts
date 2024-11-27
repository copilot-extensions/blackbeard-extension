import { Hono } from 'hono';
import { verifySignature } from './middlewares/verifySignature';
import { handlePost } from './routes/index';

const app = new Hono();

app.use('*', verifySignature);

app.post('/', handlePost);

export default app;
