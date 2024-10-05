import { QdrantClient } from '@qdrant/js-client-rest';
import { logger } from '@/lib/service/winston'; // Import the Winston logger
import chalk from 'chalk'; // Import Chalk

// Access environment variables
const QDRANT_HOST = process.env.QDRANT_HOST;
const QDRANT_PORT = process.env.QDRANT_PORT
  ? parseInt(process.env.QDRANT_PORT)
  : 6333;
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'atlasv1';

// Initialize the client with correct configuration, using the host and port from env vars
const client = new QdrantClient({
  url: `http://${QDRANT_HOST}:${QDRANT_PORT}`
});

// Example of creating a collection with extended configurations
client
  .getCollections()
  .then(async (collections) => {
    const collectionExists = collections.collections.some(
      (collection) => collection.name === QDRANT_COLLECTION
    );

    if (!collectionExists) {
      // If the collection does not exist, create it with extended configuration
      await client.createCollection(QDRANT_COLLECTION, {
        vectors: {
          size: 3072,
          distance: 'Cosine' // Distance metric for similarity
        },
        shard_number: 3, // Number of shards
        replication_factor: 2, // Number of replicas for redundancy
        write_consistency_factor: 2, // Minimum replicas that need to confirm write
        hnsw_config: {
          m: 32, // Number of bi-directional links for HNSW
          ef_construct: 200, // Controls recall during indexing
          full_scan_threshold: 5000, // Threshold for switching to full scan
          max_indexing_threads: 4 // Limit indexing threads
        },
        optimizers_config: {
          deleted_threshold: 0.1, // Proportion of deleted vectors before optimization
          vacuum_min_vector_number: 2000, // Minimum vectors required for vacuum
          default_segment_number: 4, // Initial segment number
          max_segment_size: 50000, // Max size of segments before splitting
          indexing_threshold: 10000, // Number of vectors to trigger indexing
          flush_interval_sec: 10 // Interval for flushing data to disk
        },
        wal_config: {
          wal_capacity_mb: 64, // Write-ahead log capacity in MB
          wal_segments_ahead: 2 // Number of WAL segments to keep
        },
        on_disk_payload: true // Store payload on disk
      });
      logger.info(
        chalk.green(
          `Collection ${QDRANT_COLLECTION} created with extended configurations`
        )
      );
    } else {
      logger.info(
        chalk.yellow(`Collection ${QDRANT_COLLECTION} already exists`)
      );
    }
  })
  .then(() => {
    logger.info(chalk.green('Collection check/creation complete'));
  })
  .catch((err) => {
    logger.error(
      chalk.red(`Error checking/creating collection: ${err.message}`)
    );
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
