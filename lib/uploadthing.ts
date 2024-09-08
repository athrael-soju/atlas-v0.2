import { generateReactHelpers } from '@uploadthing/react';

import type { OurFileRouter } from '@/lib/client/uploadthing';

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();
