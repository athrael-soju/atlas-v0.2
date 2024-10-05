import { UTApi } from 'uploadthing/server';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';
import { getUserData, getUserId } from '@/lib/service/mongodb';
const utapi = new UTApi();
import { KnowledgebaseFile } from '@/types/file-uploader';
import { getLocalDateTime } from '@/lib/utils';
import { logger } from '@/lib/service/winston';
import chalk from 'chalk';
import { getVectorDbProvider } from './vector-db/factory';
import cliProgress from 'cli-progress';

export const deleteFiles = async (
  userId: string,
  files: KnowledgebaseFile[]
) => {
  const start = Date.now();
  let deletedFileCount = 0;

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(files.length, 0);

  try {
    logger.info(chalk.blue(`Starting to delete files for user: ${userId}`));

    const userDataStart = Date.now();
    const userData = await getUserData(userId);
    const userDataDuration = Date.now() - userDataStart;
    logger.info(
      chalk.green(`Fetching user data took `) +
        chalk.magenta(`${userDataDuration} ms`)
    );

    const providerStart = Date.now();
    const provider = await getVectorDbProvider(
      userData.settings.forge?.vectorizationProvider || 'pcs'
    );
    const providerDuration = Date.now() - providerStart;
    logger.info(
      chalk.green(`Getting vector DB provider took `) +
        chalk.magenta(`${providerDuration} ms`)
    );

    for (const file of files) {
      logger.info(chalk.blue(`Processing deletion for file: ${file.key}`));

      if (file.dateProcessed) {
        const deleteVectorStart = Date.now();
        const deletedChunksCount = await provider.deleteFromVectorDb(
          userId,
          file
        );
        const deleteVectorDuration = Date.now() - deleteVectorStart;
        logger.info(
          chalk.green(`Deleting vector data for file: ${file.key} took `) +
            chalk.magenta(`${deleteVectorDuration} ms`)
        );

        if (!deletedChunksCount) {
          logger.error(
            chalk.red(
              `Failed to delete file chunks in vector db for file: ${file.key}`
            )
          );
          throw new Error(
            `Failed to delete file chunks vector db: ${file.key}`
          );
        }

        logger.info(
          chalk.green(
            `Successfully deleted ${deletedChunksCount} chunks for file: ${file.key} in vector db.`
          )
        );
      }

      const filesArray = files.map((file) => file.key);
      const utapiStart = Date.now();
      const response = await utapi.deleteFiles(file.key);
      const utapiDuration = Date.now() - utapiStart;
      logger.info(
        chalk.green(`Deleting file from UploadThing took `) +
          chalk.magenta(`${utapiDuration} ms`)
      );

      if (!response.success || response.deletedCount < 1) {
        logger.error(
          chalk.red(
            `Failed to delete file from UploadThing for file: ${file.key}`
          )
        );
        throw new Error(`Failed to delete file: ${file.key}`);
      }

      logger.info(
        chalk.green(`Successfully deleted file from UploadThing: ${file.key}`)
      );

      const dbUpdateStart = Date.now();
      const db = client.db('AtlasV1');
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
      const dbUpdateDuration = Date.now() - dbUpdateStart;
      logger.info(
        chalk.green(`Updating user record in DB took `) +
          chalk.magenta(`${dbUpdateDuration} ms`)
      );

      if (result.modifiedCount !== 1) {
        logger.error(
          chalk.red(
            `Failed to update user record after deleting files for user: ${userId}`
          )
        );
        throw new Error('Failed to update user after deleting files');
      }

      logger.info(
        chalk.green(
          `Successfully updated user record for user: ${userId} after deleting file: ${file.key}`
        )
      );
      deletedFileCount++;
      progressBar.increment();
    }

    progressBar.stop();
    const duration = Date.now() - start;
    logger.info(
      chalk.green(
        `Finished deleting files for user: ${userId}. Total deleted: ${deletedFileCount}. Operation took `
      ) + chalk.magenta(`${duration} ms`)
    );
    return { deletedFileCount };
  } catch (error: any) {
    progressBar.stop();
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
  const start = Date.now();
  try {
    const userIdStart = Date.now();
    const userId = await getUserId();
    const userIdDuration = Date.now() - userIdStart;
    logger.info(
      chalk.green(`Getting user ID took `) +
        chalk.magenta(`${userIdDuration} ms`)
    );

    logger.info(chalk.blue(`Listing files for user: ${userId}`));

    const dbStart = Date.now();
    const db = client.db('AtlasV1');
    const usersCollection = db.collection('users');
    const dbDuration = Date.now() - dbStart;
    logger.info(
      chalk.green(`Connecting to DB took `) + chalk.magenta(`${dbDuration} ms`)
    );

    const userQueryStart = Date.now();
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { 'files.knowledgebase': 1 } }
    );
    const userQueryDuration = Date.now() - userQueryStart;
    logger.info(
      chalk.green(`Querying user data took `) +
        chalk.magenta(`${userQueryDuration} ms`)
    );

    if (!user) {
      logger.warn(chalk.yellow(`No user found with ID: ${userId}`));
      return { files: [], hasMore: false };
    }

    const allFiles = user?.files?.knowledgebase ?? [];
    logger.info(
      chalk.green(`Found ${allFiles.length} files for user: ${userId}`)
    );

    const filterStart = Date.now();
    const filteredFiles =
      files.length > 0
        ? allFiles.filter((file: string) => files.includes(file))
        : allFiles;
    const filterDuration = Date.now() - filterStart;
    logger.info(
      chalk.green(`Filtering files took `) +
        chalk.magenta(`${filterDuration} ms`)
    );

    const duration = Date.now() - start;
    logger.info(
      chalk.green(
        `Returned ${filteredFiles.length} filtered files for user: ${userId}. Operation took `
      ) + chalk.magenta(`${duration} ms`)
    );
    return { files: filteredFiles, hasMore: false }; // Adjust `hasMore` based on pagination logic
  } catch (error: any) {
    logger.error(
      chalk.red(`Error occurred while listing files for user: ${error.message}`)
    );
    throw error;
  }
};
