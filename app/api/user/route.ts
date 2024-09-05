import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import authConfig from '@/auth.config';

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authConfig);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');

    // Find the user in the database by email
    const userEmail = session.user.email;
    const user = await usersCollection.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Extract the update data from the request body
    const updateData = await req.json();

    // Determine which part of settings to update
    const updatePath = Object.keys(updateData)[0];
    const updateValue = updateData[updatePath];
    // Apply the update to the specific field within settings
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          [`settings.${updatePath}`]: updateValue,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.modifiedCount === 1) {
      return NextResponse.json(
        { message: 'User settings updated successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'Failed to update user settings' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authConfig);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    const db = client.db('AtlasII');
    const usersCollection = db.collection('users');

    // Find the user in the database by email
    const userEmail = session.user.email;
    const user = await usersCollection.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
