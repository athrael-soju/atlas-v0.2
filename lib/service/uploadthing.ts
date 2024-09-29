import { UTApi } from 'uploadthing/server';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';
import { getUserId } from '@/lib/service/mongodb';
const utapi = new UTApi();
import { deleteFromVectorDb } from './pinecone';
import { KnowledgebaseFile } from '@/types/file-uploader';
import { getLocalDateTime } from '@/lib/utils';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';

export const deleteFiles = async (
  userId: string,
  files: KnowledgebaseFile[]
) => {
  let deletedFileCount = 0;
  const id = userId;

  try {
    logger.info(chalk.blue(`Starting to delete files for user: ${userId}`));

    for (const file of files) {
      logger.info(chalk.blue(`Processing deletion for file: ${file.key}`));

      if (file.dateProcessed) {
        const deletedChunksCount = await deleteFromVectorDb(id, file);

        if (!deletedChunksCount) {
          logger.error(
            chalk.red(
              `Failed to delete file chunks in vector db for file: ${file.key}`
            )
          );
          throw new Error(
            chalk.red(`Failed to delete file chunks vector db: ${file.key}`)
          );
        }

        logger.info(
          chalk.green(
            `Successfully deleted ${deletedChunksCount} chunks for file: ${file.key} in vector db.`
          )
        );
      }

      const filesArray = files.map((file) => file.key);
      const response = await utapi.deleteFiles(file.key);

      if (!response.success || response.deletedCount < 1) {
        logger.error(
          chalk.red(
            `Failed to delete file from UploadThing for file: ${file.key}`
          )
        );
        throw new Error(chalk.red(`Failed to delete file: ${file.key}`));
      }

      logger.info(
        chalk.green(`Successfully deleted file from UploadThing: ${file.key}`)
      );

      const db = client.db('AtlasII');
      const usersCollection = db.collection('users');
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $pull: { 'files.knowledgebase': { key: { $in: filesArray } } as any },
          $set: {
            updatedAt: getLocalDateTime()
          }
        }
      );

      if (result.modifiedCount !== 1) {
        logger.error(
          chalk.red(
            `Failed to update user record after deleting files for user: ${userId}`
          )
        );
        throw new Error(
          chalk.red('Failed to update user after deleting files')
        );
      }

      logger.info(
        chalk.green(
          `Successfully updated user record for user: ${userId} after deleting file: ${file.key}`
        )
      );
      deletedFileCount++;
    }

    logger.info(
      chalk.green(
        `Finished deleting files for user: ${userId}. Total deleted: ${deletedFileCount}`
      )
    );
    return { deletedFileCount };
  } catch (error: any) {
    logger.error(
      chalk.red(
        `Error occurred while deleting files for user: ${userId}. Error: ${error.message}`
      )
    );
    throw error;
  }
};

// File listing function
export const listFiles = async (files: string[] = []) => {
  try {
    const userId = await getUserId();
    logger.info(chalk.blue(`Listing files for user: ${userId}`));

    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { 'files.knowledgebase': 1 } }
    );

    if (!user) {
      logger.warn(chalk.yellow(`No user found with ID: ${userId}`));
      return { files: [], hasMore: false };
    }

    const allFiles = user?.files?.knowledgebase ?? [];
    logger.info(
      chalk.green(`Found ${allFiles.length} files for user: ${userId}`)
    );

    const filteredFiles =
      files.length > 0
        ? allFiles.filter((file: string) => files.includes(file))
        : allFiles;

    logger.info(
      chalk.green(
        `Returning ${filteredFiles.length} filtered files for user: ${userId}`
      )
    );
    return { files: filteredFiles, hasMore: false }; // Adjust `hasMore` based on pagination logic
  } catch (error: any) {
    logger.error(
      chalk.red(`Error occurred while listing files for user: ${error.message}`)
    );
    throw error;
  }
};

// File URL retrieval
