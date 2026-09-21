import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { UploadThingError } from 'uploadthing/server';
import { MAX_FILES, uploadError } from './validation';

const f = createUploadthing();

export const ourFileRouter = {
  orderFiles: f({
    image: { maxFileSize: '64MB', maxFileCount: MAX_FILES },
    blob: { maxFileSize: '64MB', maxFileCount: MAX_FILES },
  })
    .middleware(({ files }) => {
      const error = uploadError(files);
      if (error) throw new UploadThingError(error);
      return {};
    })
    .onUploadComplete(({ file }) => {
      console.log('[uploadthing] upload complete:', file.name, file.ufsUrl);
      return { url: file.ufsUrl, name: file.name, size: file.size };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
