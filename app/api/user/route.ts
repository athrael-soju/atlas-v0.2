import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserField } from '@/lib/service/mongodb'; // Adjust the import path accordingly
import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';
import { getLocalDateTime } from '@/lib/utils';
import { logger } from '@/lib/service/winston'; // Import Winston logger
import chalk from 'chalk'; // Import Chalk for colorized logging

// Utility function to fetch and validate session
async function getValidSession() {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user || !session.user.id) {
      return null;
    }
    return session;
  } catch (error: any) {
    return null;
  }
}

// Utility function to handle updating fields
async function handleUpdate(
  userId: string,
  updateData: Record<string, any>,
  fieldPath: string
) {
  try {
    return await updateUserField(userId, {
      $set: {
        [fieldPath]: updateData,
        updatedAt: getLocalDateTime()
      }
    });
  } catch (error: any) {
    throw error;
  }
}

// POST Route - Dynamic updates to user data
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START POST REQUEST ====================')
  );
  logger.info(chalk.blue('POST request received  for updating user data'));

  try {
    const session = await getValidSession();
    if (!session) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Unauthorized request - No valid session found - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { path, data } = await req.json();

    // Validate request payload
    if (!path || typeof path !== 'string' || !data) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Invalid request payload - Missing path or data - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END POST REQUEST ======================'
        )
      );
      return NextResponse.json(
        { message: 'Invalid request, path and data are required' },
        { status: 400 }
      );
    }

    // Perform the update based on the provided path and data
    const response = await handleUpdate(userId, data, path);

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`User data updated successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.error(
      chalk.red(
        `Error occurred during POST request - ${error.message} - Request took `
      ) + chalk.magenta(`${duration} ms`),
      {
        stack: error.stack
      }
    );
    logger.info(
      chalk.blue('==================== END POST REQUEST ======================')
    );
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// GET Route - Fetching dynamic parts of user data
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  logger.info(
    chalk.blue('==================== START GET REQUEST ====================')
  );
  logger.info(chalk.blue('GET request received for fetching user data'));

  try {
    const session = await getValidSession();
    if (!session) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Unauthorized request - No valid session found - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END GET REQUEST ======================'
        )
      );
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    // Validate the 'path' query parameter
    if (!path || typeof path !== 'string') {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(
          `Invalid request - Path parameter is required - Request took `
        ) + chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END GET REQUEST ======================'
        )
      );
      return NextResponse.json(
        { message: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Fetch user data from the database
    const userData = await getUserData(userId);

    // Use dynamic path access, e.g., userData['settings.chat']
    const dataAtPath = path
      .split('.')
      .reduce((obj, key) => (obj as Record<string, any>)?.[key], userData);

    if (dataAtPath === undefined) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      logger.error(
        chalk.red(`Data not found at path: ${path} - Request took `) +
          chalk.magenta(`${duration} ms`)
      );
      logger.info(
        chalk.blue(
          '==================== END GET REQUEST ======================'
        )
      );
      return NextResponse.json(
        { message: `Data not found at path: ${path}` },
        { status: 404 }
      );
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    logger.info(
      chalk.green(`User data fetched successfully - Request took `) +
        chalk.magenta(`${duration} ms`)
    );
    logger.info(
      chalk.blue('==================== END GET REQUEST ======================')
    );

    return NextResponse.json({ [path]: dataAtPath }, { status: 200 });
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
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
