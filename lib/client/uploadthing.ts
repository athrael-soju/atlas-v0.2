import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getUserId } from '@/lib/service/mongodb';

import { updateUserFiles } from '@/lib/service/mongodb';

const f = createUploadthing();

// Function to handle the upload completion logic
const handleUploadComplete = async ({
  metadata,
  file
}: {
  metadata: any;
  file: any;
}) => {
  const uploadedFile = {
    name: file.name,
    url: file.url,
    size: file.size,
    key: file.key,
    dateUploaded: new Date().toISOString(),
    dateProcessed: null
  };
  await updateUserFiles(metadata.userId, uploadedFile);
};

// Define file router rules
const defineFileRouter = (config: any) =>
  f(config)
    .middleware(async () => ({ userId: await getUserId() }))
    .onUploadComplete(handleUploadComplete);

// FileRouter implementation
export const ourFileRouter = {
  attachment: defineFileRouter({
    text: { maxFileCount: 5, maxFileSize: '5MB' },
    image: { maxFileCount: 5, maxFileSize: '10MB' },
    video: { maxFileCount: 1, maxFileSize: '100MB' },
    audio: { maxFileCount: 5, maxFileSize: '10MB' },
    pdf: { maxFileCount: 5, maxFileSize: '10MB' }
  })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
