const createFormData = (userId: string, selectedFiles: string[]): FormData => {
  const formData = new FormData();
  formData.append('fileIds', JSON.stringify(selectedFiles));
  formData.append('userId', userId);
  return formData;
};
let contextEnrichedMessage: string | null = null;

const handleSSEChunk = (data: string) => {
  const { status, message } = JSON.parse(data);
  if (status === 'Reranking complete') {
    contextEnrichedMessage = message;
  } else if (status === 'No context') {
    contextEnrichedMessage = null;
  }
};

const processStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder
) => {
  let buffer = '';
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

const fetchDataWithStream = async (url: string, options: RequestInit) => {
  const response = await fetch(url, options);

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    await processStream(reader, decoder);
  } else {
    throw new Error(`Failed to start processing: ${response.statusText}`);
  }
};

export const processSelectedFiles = async (
  userId: string,
  selectedFiles: string[]
): Promise<void> => {
  const formData = createFormData(userId, selectedFiles);
  await fetchDataWithStream('/api/forge', {
    method: 'POST',
    body: formData
  });
};

export const fetchContextEnrichedMessage = async (
  userId: string,
  text: string
) => {
  const queryString = new URLSearchParams({ userId, message: text }).toString();
  await fetchDataWithStream(`/api/knowledgebase?${queryString}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return contextEnrichedMessage;
};

export const updateAnalysisAssistant = async (
  userId: string,
  fileIds: string[]
): Promise<Response> => {
  const formData = createFormData(userId, fileIds);
  const response = await fetch('/api/assistants/files/analysis', {
    method: 'PUT',
    body: formData
  });
  if (!response.ok) {
    throw new Error('Failed to update analysis assistant');
  }
  return response.json();
};

export const updateKnowledgebaseAssistant = async (
  userId: string
): Promise<Response> => {
  const formData = createFormData(userId, []);
  const response = await fetch('/api/assistants/files/knowledgebase', {
    method: 'PUT',
    body: formData
  });
  if (!response.ok) {
    throw new Error('Failed to update knowledgebase assistant');
  }
  return response.json();
};
