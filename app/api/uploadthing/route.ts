import { createRouteHandler } from 'uploadthing/next';

import {
  ourFileRouter,
  deleteFiles,
  listFiles
} from '@/lib/service/uploadthing';
import { NextRequest, NextResponse } from 'next/server';
export const { POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    logLevel: 'info'
  }
});
export async function GET() {
  try {
    const result = await listFiles();
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, files } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!files) {
      return NextResponse.json(
        { error: 'Invalid request, file(s) do not exist' },
        { status: 400 }
      );
    }

    const result = await deleteFiles(userId, files);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
