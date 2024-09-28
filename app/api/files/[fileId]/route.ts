import { openai } from '@/lib/client/openai';
import { logger } from '@/lib/service/winston'; // Import Winston logger

// Download file by file ID
export async function GET(
  _request: Request,
  { params: { fileId } }: { params: { fileId: string } }
) {
  try {
    logger.info(`GET request received to download file with ID: ${fileId}`);

    // Validate if fileId is provided
    if (!fileId) {
      logger.warn('No fileId provided in the request');
      return new Response(
        JSON.stringify({ error: 'Missing fileId in request' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve the file metadata and content
    const [file, fileContent] = await Promise.all([
      openai.files.retrieve(fileId),
      openai.files.content(fileId)
    ]);

    if (!file || !fileContent) {
      logger.error(`File or file content not found for ID: ${fileId}`);
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    logger.info(
      `Successfully retrieved file with ID: ${fileId}, starting download`
    );

    // Return the file content as a response with the appropriate headers
    return new Response(fileContent.body, {
      headers: {
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Type': 'application/octet-stream' // Ensure binary content is handled correctly
      }
    });
  } catch (error: any) {
    logger.error(
      `Error downloading file with ID: ${fileId}: ${
        error.message || 'Unknown error'
      }`
    );
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
