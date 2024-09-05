import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API as string;
const indexName = process.env.PINECONE_INDEX as string;

if (!apiKey) {
  throw new Error('PINECONE_API is not set');
}

if (!indexName) {
  throw new Error('PINECONE_INDEX is not set');
}

const pineconeClient = new Pinecone({ apiKey, fetchApi: fetch });

const getClient = async () => {
  return pineconeClient;
};

export const getIndex = async () => {
  const client = await getClient();
  return client.index(indexName);
};
