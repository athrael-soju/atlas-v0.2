import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getUserId } from '@/lib/service/mongodb';

import { updateUserFiles } from '@/lib/service/mongodb';
import { getLocalDateTime } from '../utils';

const f = createUploadthing();

// Function to handle the upload completion logic
const handleUploadComplete = async ({
  metadata,
  file
}: {
  metadata: any;
  file: any;
}) => {
  const knowledgebaseFile = {
    name: file.name,
    url: file.url,
    size: file.size,
    key: file.key,
    dateUploaded: getLocalDateTime(),
    dateProcessed: null
  };
  await updateUserFiles(metadata.userId, knowledgebaseFile);
};

// Define file router rules
const defineFileRouter = (config: any) =>
  f(config)
    .middleware(async () => ({ userId: await getUserId() }))
    .onUploadComplete(handleUploadComplete);

// FileRouter implementation
export const ourFileRouter = {
  attachment: defineFileRouter({
    text: { maxFileCount: 5, maxFileSize: '50MB' },
    image: { maxFileCount: 5, maxFileSize: '50MB' },
    video: { maxFileCount: 1, maxFileSize: '100MB' },
    audio: { maxFileCount: 5, maxFileSize: '50MB' },
    pdf: { maxFileCount: 5, maxFileSize: '50MB' }
  })
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
