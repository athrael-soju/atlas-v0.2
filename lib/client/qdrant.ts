import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '@/lib/service/winston'; // Import the Winston logger
import chalk from 'chalk'; // Import Chalk

// Access environment variables
const QDRANT_HOST = process.env.QDRANT_HOST;
const QDRANT_PORT = process.env.QDRANT_PORT
  ? parseInt(process.env.QDRANT_PORT)
  : 6333;
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'atlas-ii';

// Initialize the client with correct configuration, using the host and port from env vars
const client = new QdrantClient({
  url: `http://${QDRANT_HOST}:${QDRANT_PORT}`
});

// Example of creating a collection with basic vectors
client
  .createCollection(QDRANT_COLLECTION, {
    vectors: { size: 3072, distance: 'Cosine' }
  })
  .then(() => {
    // Log success message with Chalk for color
    logger.info(chalk.green('Collection created successfully'));
  })
  .catch((err) => {
    // Log error message with Chalk for color
    logger.error(chalk.red(`Error creating collection: ${err.message}`));
  });

// Example of creating a collection with sparse vectors
// client
//   .createCollection(QDRANT_COLLECTION, {
//     vectors: { size: 100, distance: 'Cosine' },
//     sparse_vectors: {
//       'splade-model-name': {
//         index: {
//           on_disk: false
//         }
//       }
//     }
//   })
//   .then(() => {
//     // Log success message with Chalk for color
//     logger.info(chalk.green('Sparse collection created successfully'));
//   })
//   .catch((err) => {
//     // Log error message with Chalk for color
//     logger.error(chalk.red(`Error creating sparse collection: ${err.message}`));
//   });

export { client };
