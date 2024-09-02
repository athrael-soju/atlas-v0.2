export const processSelecedFiles = async (
  userId: string,
  selectedFiles: string[]
) => {
  const formData = new FormData();
  formData.append('fileIds', JSON.stringify(selectedFiles));
  formData.append('userId', userId);

  await fetch('/api/forge', {
    method: 'POST',
    body: formData
  });
  
};
