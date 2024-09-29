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
    logLevel: 'info'
  }
});

// GET route for listing files
export async function GET() {
  try {
    logger.info(chalk.blue('GET request received for listing files.'));
    const result = await listFiles();
    logger.info(
      chalk.green(`Successfully retrieved ${result.files.length} files.`)
    );
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error(chalk.red(`Error listing files: ${error.message}`));
    return NextResponse.json(
      { error: 'Failed to retrieve files' },
      { status: 500 }
    );
  }
}

// DELETE route for deleting files
export async function DELETE(req: NextRequest) {
  try {
    logger.info(chalk.blue('DELETE request received for file deletion.'));

    const body = await req.json();
    const { userId, files } = body;

    if (!userId) {
      logger.warn(chalk.yellow('Unauthorized request: Missing userId.'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      logger.warn(
        chalk.yellow('Invalid file deletion request: No files provided.')
      );
      return NextResponse.json(
        { error: 'Invalid request, file(s) do not exist' },
        { status: 400 }
      );
    }

    logger.info(chalk.blue(`Deleting files for user: ${userId}`));
    const result = await deleteFiles(userId, files);
    logger.info(chalk.green(`Successfully deleted files for user: ${userId}`));

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error(chalk.red(`Error deleting files: ${error.message}`));
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    );
  }
}
