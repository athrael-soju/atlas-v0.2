import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserField } from '@/lib/service/mongodb'; // Adjust the import path accordingly
import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';
import { getLocalDateTime } from '@/lib/utils';
import { logger } from '@/lib/service/winston'; // Import Winston logger

// Utility function to fetch and validate session
async function getValidSession() {
  try {
    const session = await getServerSession(authConfig);
    if (!session || !session.user || !session.user.id) {
      logger.warn('Unauthorized access attempt');
      return null;
    }
    return session;
  } catch (error: any) {
    logger.error(`Error retrieving session: ${error.message}`);
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
    logger.info(`Updating user data for userId: ${userId}, path: ${fieldPath}`);
    return await updateUserField(userId, {
      $set: {
        [fieldPath]: updateData,
        updatedAt: getLocalDateTime()
      }
    });
  } catch (error: any) {
    logger.error(`Error updating user field: ${error.message}`);
    throw error;
  }
}

// POST Route - Dynamic updates to user data
export async function POST(req: NextRequest) {
  try {
    const session = await getValidSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { path, data } = await req.json();

    // Validate request payload
    if (!path || typeof path !== 'string' || !data) {
      logger.warn('Invalid POST request, missing path or data.');
      return NextResponse.json(
        { message: 'Invalid request, path and data are required' },
        { status: 400 }
      );
    }

    // Perform the update based on the provided path and data
    const response = await handleUpdate(userId, data, path);

    logger.info(
      `User data updated successfully for userId: ${userId}, path: ${path}`
    );
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    logger.error(`Error in POST request: ${error.message}`);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

// GET Route - Fetching dynamic parts of user data
export async function GET(req: NextRequest) {
  try {
    const session = await getValidSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path');

    // Validate the 'path' query parameter
    if (!path || typeof path !== 'string') {
      logger.warn('Invalid GET request, missing path parameter.');
      return NextResponse.json(
        { message: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Fetch user data from the database
    logger.info(`Fetching user data for userId: ${userId}, path: ${path}`);
    const userData = await getUserData(userId);

    // Use dynamic path access, e.g., userData['settings.chat']
    const dataAtPath = path
      .split('.')
      .reduce((obj, key) => (obj as Record<string, any>)?.[key], userData);

    if (dataAtPath === undefined) {
      logger.warn(`Data not found at path: ${path} for userId: ${userId}`);
      return NextResponse.json(
        { message: `Data not found at path: ${path}` },
        { status: 404 }
      );
    }

    logger.info(`User data fetched successfully for path: ${path}`);
    return NextResponse.json({ [path]: dataAtPath }, { status: 200 });
  } catch (error: any) {
    logger.error(`Error in GET request: ${error.message}`);
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
