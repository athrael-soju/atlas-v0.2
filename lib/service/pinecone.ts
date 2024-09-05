import { getIndex } from '@/lib/client/pinecone';
import { UploadedFile } from '@/types/file-uploader';
import { Embedding } from '@/types/settings';
import { Index } from '@pinecone-database/pinecone';
import { toAscii } from '@/lib/utils';

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

export async function query(userEmail: string, embeddings: any, topK: number) {
  try {
    const response = await queryByNamespace(userEmail, topK, embeddings.values);
    const context = response.matches.map((item: any) => {
      const contextItem: any = {
        text: item.metadata.text,
        filename: item.metadata.filename,
        filetype: item.metadata.filetype,
        languages: item.metadata.languages.join(', '),
        user_email: item.metadata.user_email
      };
      // If file is CSV, there is always 1 page.
      if (item.metadata.page_number) {
        contextItem.page_number = item.metadata.page_number.toString();
      }
      return contextItem;
    });

    return {
      message: 'Pinecone query successful',
      namespace: userEmail,
      context
    };
  } catch (error: any) {
    throw new Error(`Failed to query Pinecone: ${error.message}`);
  }
}

const queryByNamespace = async (
  namespace: string,
  topK: number,
  embeddedMessage: any
) => {
  try {
    const index = await getIndex();
    const result = await index.namespace(namespace).query({
      topK: topK,
      vector: embeddedMessage,
      includeValues: false,
      includeMetadata: true
    });
    return result;
  } catch (error: any) {
    throw new Error(`Failed querying by namespace: ${error.message}`);
  }
};

export const upsertDocument = async (
  userId: string,
  embeddings: Embedding[],
  chunkBatch: number
) => {
  try {
    let upsertedChunkCount = 0;
    const index = await getIndex();
    const chunkedData = chunkArray(embeddings, chunkBatch);
    for (const chunk of chunkedData) {
      index.namespace(userId).upsert(chunk);
      upsertedChunkCount += chunk.length;
    }
    return upsertedChunkCount;
  } catch (error: any) {
    throw new Error(`Failed to upsert documents: ${error.message}`);
  }
};

export async function deleteFromVectorDb(
  userId: string,
  file: UploadedFile
): Promise<number> {
  const pageSize = 100;
  let paginationToken: string | undefined;
  let deletedCount = 0;

  const index = await getIndex();
  const namespace = index.namespace(userId);
  do {
    try {
      const result = await listArchiveChunks(
        file,
        namespace,
        pageSize,
        paginationToken
      );
      if (result.chunks.length === 0) {
        break;
      }

      const chunkIds = result.chunks.map((chunk) => chunk.id);
      await namespace.deleteMany(chunkIds);
      deletedCount += chunkIds.length;
      paginationToken = result.paginationToken;
    } catch (error: any) {
      throw new Error(
        `Purge archive in Vector DB failed: ${error.message} for document ${file.key}`
      );
    }
  } while (paginationToken !== undefined);
  return deletedCount;
}

async function listArchiveChunks(
  file: UploadedFile,
  namespace: Index,
  limit: number,
  paginationToken?: string
): Promise<{ chunks: { id: string }[]; paginationToken?: string }> {
  const listResult = await namespace.listPaginated({
    prefix: `${toAscii(file.name)}#${file.key}`,
    limit: limit,
    paginationToken: paginationToken
  });

  const chunks =
    listResult.vectors?.map((vector) => ({ id: vector.id || '' })) || [];
  return { chunks, paginationToken: listResult.pagination?.next };
}
