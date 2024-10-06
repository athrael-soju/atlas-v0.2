import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from '@/lib/client/uploadthing';
import { deleteFiles, listFiles } from '@/lib/service/uploadthing';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

// POST route for file upload
export const { POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    logLevel: 'Info'
  }
});

// GET route for listing files
export async function GET() {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START GET REQUEST ====================')
  );
  logger.info(chalk.blue('GET request received for listing files'));

  try {
    const result = await listFiles();

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`Files listed successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(`Failed to retrieve files - ${error.message} - Request took `) +
        chalk.magenta(`${duration} ms`),
      {
        stack: error.stack
      }
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );

    return NextResponse.json(
      { error: 'Failed to retrieve files' },
      { status: 500 }
    );
  }
}

// DELETE route for deleting files
export async function DELETE(req: NextRequest) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START DELETE REQUEST ====================')
  );
  logger.info(chalk.blue('DELETE request received for deleting files'));

  try {
    const body = await req.json();
    const { userId, files } = body;

    if (!userId) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Unauthorized request - Missing userId - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END DELETE REQUEST ======================'
        )
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Invalid request - File(s) do not exist - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END DELETE REQUEST ======================'
        )
      );
      return NextResponse.json(
        { error: 'Invalid request, file(s) do not exist' },
        { status: 400 }
      );
    }

    const result = await deleteFiles(userId, files);

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`Files deleted successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue(
        '==================== END DELETE REQUEST ======================'
      )
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(`Failed to delete files - ${error.message} - Request took `) +
        chalk.magenta(`${duration} ms`),
      {
        stack: error.stack
      }
    );
    logger.info(
      chalk.blue(
        '==================== END DELETE REQUEST ======================'
      )
    );

    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}
