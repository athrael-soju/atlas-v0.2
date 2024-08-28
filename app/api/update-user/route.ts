// app\api\update-user\route.ts
import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/client/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';

// Ensure this is correctly imported from your auth config
import authConfig from '@/auth.config';

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authConfig);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Connect to the database
    const clientInstance = await client;
    const db = clientInstance.db('AtlasII');
    const usersCollection = db.collection('users');

    // Find the user in the database by email
    const userEmail = session.user.email;
    const user = await usersCollection.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Extract the update data from the request body
    const updateData = await req.json();

    // Remove any fields that should not be updated (e.g., _id, email)
    delete updateData._id;
    delete updateData.email; // Presumably, you don’t want the email to be updated

    // Apply the update to the user's document under the "settings" key
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          settings: updateData,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.modifiedCount === 1) {
      return NextResponse.json(
        { message: 'User updated successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'Failed to update user' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
