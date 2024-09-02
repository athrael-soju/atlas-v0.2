export const processSelectedFiles = async (
  userId: string,
  selectedFiles: string[]
): Promise<void> => {
  const formData = new FormData();
  formData.append('fileIds', JSON.stringify(selectedFiles));
  formData.append('userId', userId);

  const response = await fetch('/api/forge', {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const reader = response.body?.getReader();
    if (!reader) {
      console.error('No reader available on the response body');
      return;
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Each chunk corresponds to a line of data sent by SSE
      // Parse and handle the chunk as JSON if it's structured data
      try {
        const { status, message } = JSON.parse(chunk.replace('data: ', ''));
        console.info('Status:', status, ': ', message);
      } catch (e) {
        console.error('Failed to parse chunk:', e);
      }
    }
  } else {
    console.error('Failed to start processing', response.statusText);
  }
};
