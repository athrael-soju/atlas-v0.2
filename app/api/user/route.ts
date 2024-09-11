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

export async function POST(req: NextRequest) {
  try {
    const session = await getValidSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const updateData = await req.json();

    const updateMappings = {
      'settings.chat': updateData.chat,
      'settings.misc': updateData.misc,
      'settings.forge': updateData.forge,
      'settings.knowledgebase': updateData.knowledgebase,
      'settings.profile': updateData.profile
    };

    // Check for valid update fields and handle them dynamically
    for (const [fieldPath, data] of Object.entries(updateMappings)) {
      if (data) {
        const response = await handleUpdate(userId, data, fieldPath);
        return NextResponse.json(response, { status: 200 });
      }
    }

    // Handle special case for uploadedFile separately
    if (updateData.uploadedFile) {
      const response = await updateUserField(userId, {
        $push: { 'knowledgebase.files': updateData.uploadedFile },
        $set: { updatedAt: new Date().toISOString() }
      });
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { message: 'Invalid update operation' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getValidSession();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userData = await getUserData(userId);

    if (!userData || !userData.settings) {
      return NextResponse.json(
        { message: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(userData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    );
  }
}
