import { NextRequest, NextResponse } from 'next/server';
import { getUserData, updateUserField } from '@/lib/service/mongodb'; // Adjust the import path accordingly

import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const updateData = await req.json();
    console.log(updateData);
    // Handle updating `knowledgebaseEnabled`
    if (typeof updateData.knowledgebaseEnabled === 'boolean') {
      const response = await updateUserField(userId, {
        $set: {
          'settings.chat.knowledgebaseEnabled': updateData.knowledgebaseEnabled,
          updatedAt: new Date().toISOString()
        }
      });
      return NextResponse.json(response, { status: 200 });
    }

    // Handle updating `settings.forge`
    if (updateData.forge) {
      const response = await updateUserField(userId, {
        $set: {
          'settings.forge': updateData.forge, // Use the correct key path for updating
          updatedAt: new Date().toISOString()
        }
      });
      return NextResponse.json(response, { status: 200 });
    }

    // Handle updating `settings.knowledgebase`
    if (updateData.knowledgebase) {
      const response = await updateUserField(userId, {
        $set: {
          'settings.knowledgebase': updateData.knowledgebase, // Update the knowledgebase settings
          updatedAt: new Date().toISOString()
        }
      });
      return NextResponse.json(response, { status: 200 });
    }

    // Handle file upload
    if (updateData.uploadedFile) {
      const response = await updateUserField(userId, {
        $push: { 'knowledgebase.files': updateData.uploadedFile },
        $set: { updatedAt: new Date().toISOString() }
      });
      return NextResponse.json(response, { status: 200 });
    }

    // Handle invalid update operations
    return NextResponse.json(
      { message: 'Invalid update operation' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in POST request:', error.message);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET route to retrieve user data
export async function GET(req: NextRequest) {
  try {
    // TODO: Validage the user session with front end
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
