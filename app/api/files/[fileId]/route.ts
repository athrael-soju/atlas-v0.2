import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

// Download file by file ID
export async function GET(
  _request: Request,
  { params: { fileId } }: { params: { fileId: string } }
) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START GET REQUEST ====================')
  );
  logger.info(
    chalk.blue('GET request received for downloading file by fileId')
  );

  try {
    // Validate if fileId is provided
    if (!fileId) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Missing fileId in request - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END GET REQUEST ======================'
        )
      );

      return new Response(
        JSON.stringify({ error: 'Missing fileId in request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve the file metadata and content
    const [file, fileContent] = await Promise.all([
      openai.files.retrieve(fileId),
      openai.files.content(fileId)
    ]);

    if (!file || !fileContent) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`File not found - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END GET REQUEST ======================'
        )
      );

      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`File downloaded successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );

    // Return the file content as a response with the appropriate headers
    return new Response(fileContent.body, {
      headers: {
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Type': 'application/octet-stream' // Ensure binary content is handled correctly
      }
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(
        `Error occurred during GET request - ${error.message} - Request took `
      ) + chalk.magenta(`${duration} ms`),
      {
        stack: error.stack
      }
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );

    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
