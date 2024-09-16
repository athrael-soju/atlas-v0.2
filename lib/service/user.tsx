export const fetchUserData = async (path: string): Promise<any> => {
  try {
    const response = await fetch(`/api/user?path=${path}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    const result = await response.json();
    return result[path];
  } catch (error) {
    console.error('Fetch error: ', error);
    throw error;
  }
};

export const updateUserData = async (
  path: string,
  data: any
): Promise<void> => {
  try {
    const response = await fetch(`/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, data })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend responded with error:', errorText);
      throw new Error('Failed to update user data');
    }
  } catch (error) {
    console.error('Update error: ', error);
    throw error;
  }
};
