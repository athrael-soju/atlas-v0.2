import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserField } from '@/lib/service/mongodb'; // Adjust the import path accordingly
import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';

// Utility function to fetch and validate session
async function getValidSession() {
  const session = await getServerSession(authConfig);
  if (!session || !session.user || !session.user.id) {
    return null;
  }
  return session;
}

// Utility function to handle updating fields
async function handleUpdate(
  userId: string,
  updateData: Record<string, any>,
  fieldPath: string
) {
  return await updateUserField(userId, {
    $set: {
      [fieldPath]: updateData,
      updatedAt: new Date().toISOString()
    }
  });
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
    if (!path || !data) {
      return NextResponse.json(
        { message: 'Invalid request, path and data are required' },
        { status: 400 }
      );
    }

    // Perform the update based on the provided path and data
    const response = await handleUpdate(userId, data, path);

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
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
    if (!path) {
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
    // Handle case where the data at the specified path does not exist
    if (dataAtPath === undefined) {
      return NextResponse.json(
        { message: `Data not found at path: ${path}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ [path]: dataAtPath }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
