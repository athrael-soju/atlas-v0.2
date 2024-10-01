import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  host: process.env.QDRANT_HOST,
  port: process.env.QDRANT_PORT as unknown as number
});
if (!client.collectionExists(process.env.QDRANT_COLLECTION as string)) {
  const colectionCreated = await client.createCollection(
    process.env.QDRANT_COLLECTION as string,
    {
      vectors: { size: 3072, distance: 'Cosine' }
    }
  );

  if (colectionCreated == false) {
    throw new Error('Failed to create collection');
  }
}

// or with sparse vectors
// client.createCollection(process.env.QDRANT_COLLECTION, {
//   vectors: { size: 100, distance: 'Cosine' },
//   sparse_vectors: {
//     'splade-model-name': {
//       index: {
//         on_disk: false
//       }
//     }
//   }
// });

export default client;
