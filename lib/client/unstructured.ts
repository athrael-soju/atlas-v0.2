import { UnstructuredClient } from 'unstructured-client';

const apiKey = process.env['UNSTRUCTURED_API'];
const serverURL = process.env['UNSTRUCTURED_SERVER_URL'];

if (!apiKey) {
  throw new Error('UNSTRUCTURED_API is not set');
}

if (!serverURL) {
  throw new Error('UNSTRUCTURED_SERVER_URL is not set');
}

export const unstructuredClient = new UnstructuredClient({
  security: {
    apiKeyAuth: apiKey
  },
  serverURL
});
