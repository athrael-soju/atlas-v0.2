import { CohereClient } from 'cohere-ai';

const apiKey = process.env['COHERE_API_KEY'];
const model = process.env['COHERE_API_MODEL'];

if (!apiKey) {
  throw new Error('COHERE_API_KEY is not set');
}

if (!model) {
  throw new Error('COHERE_API_MODEL is not set');
}

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY ?? ''
});

export { cohere, model };
