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

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processStream = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 2);

          if (chunk.startsWith('data:')) {
            handleSSEChunk(chunk.slice(5).trim());
          }
        }
      }
    };

    const handleSSEChunk = (data: string) => {
      try {
        const { status, message } = JSON.parse(data);
        console.info('Status: ', status, ' message: ', message);
      } catch (e) {
        console.error('Failed to parse chunk:', e);
      }
    };

    await processStream();
    console.info('Processing complete');
  } else {
    console.error('Failed to start processing', response.statusText);
  }
};
