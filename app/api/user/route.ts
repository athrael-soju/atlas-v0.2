import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserField } from '@/lib/service/mongodb'; // Adjust the import path accordingly
import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';

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
    const session = await getServerSession(authConfig);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const updateData = await req.json();
    let response;

    if (typeof updateData.knowledgebaseEnabled === 'boolean') {
      response = await handleUpdate(
        userId,
        updateData.knowledgebaseEnabled,
        'settings.chat.knowledgebaseEnabled'
      );
    } else if (updateData.forge) {
      response = await handleUpdate(userId, updateData.forge, 'settings.forge');
    } else if (updateData.knowledgebase) {
      response = await handleUpdate(
        userId,
        updateData.knowledgebase,
        'settings.knowledgebase'
      );
    } else if (updateData.uploadedFile) {
      response = await updateUserField(userId, {
        $push: { 'knowledgebase.files': updateData.uploadedFile },
        $set: { updatedAt: new Date().toISOString() }
      });
    } else {
      return NextResponse.json(
        { message: 'Invalid update operation' },
        { status: 400 }
      );
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST request:', error.message);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || !session.user || !session.user.id) {
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
    console.error('Error in GET request:', error.message);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
