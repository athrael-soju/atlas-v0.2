import { UnstructuredClient } from 'unstructured-client';

const serverURL = process.env['UNSTRUCTURED_SERVER_URL'];

if (!serverURL) {
  throw new Error('UNSTRUCTURED_SERVER_URL is not set');
}
export const unstructuredClient = new UnstructuredClient({
  serverURL
});
