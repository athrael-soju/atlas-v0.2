import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
//import { ratelimit } from '@/lib/rate-limit';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();
const f = createUploadthing();

// TODO: Add auth
const auth = (req: Request) => ({ id: 'fakeId' });

const middleware = async (req: Request) => {
  const user = auth(req);
  if (!user.id) {
    throw new UploadThingError('Unauthorized');
  }
  // TODO: Add rate limiting
  // const success = await ratelimit.limit(user.id);
  // if (!success) {
  //   throw new UploadThingError('Rate limit exceeded');
  // }

  return { userId: user.id };
};

export const ourFileRouter = {
  image: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async ({ req }) => middleware(req))
    .onUploadComplete(() => {}),
  attachment: f(['text', 'image', 'video', 'audio', 'pdf'])
    .middleware(async ({ req }) => middleware(req))
    .onUploadComplete(() => {}),
  video: f({ video: { maxFileCount: 1, maxFileSize: '512GB' } })
    .middleware(async ({ req }) => middleware(req))
    .onUploadComplete(() => {})
} satisfies FileRouter;

export const deleteFiles = async (files: string[]) => {
  try {
    const response = await utapi.deleteFiles(files);
    return { success: response.success, deleteCount: response.deletedCount };
  } catch (error: any) {
    throw new Error('Error deleting files', error);
  }
};

export type OurFileRouter = typeof ourFileRouter;
