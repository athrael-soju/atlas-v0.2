import { useEffect } from 'react';
import { DefaultValues, FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// Generic function to fetch data from any part of the user object
async function fetchUserData(path: string): Promise<any> {
  const response = await fetch(`/api/user?path=${path}`, { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  const result = await response.json();
  return result[path];
}

// Generic function to update any part of the user object
async function updateUserData(
  path: string,
  data: Partial<Record<string, any>>
): Promise<void> {
  const response = await fetch(`/api/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, data })
  });
  if (!response.ok) {
    throw new Error('Failed to update user data');
  }
}

// Parameters for useUserForm to make it generic
interface UseUserFormParams<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  formPath: string; // Can now point to any part of the user object
}

// The updated and more generic useUserForm hook
export function useUserForm<T extends FieldValues>({
  schema,
  defaultValues,
  formPath
}: UseUserFormParams<T>) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ['userData', userId, formPath],
    queryFn: () => fetchUserData(formPath),
    enabled: !!userId
  });

  const mutation = useMutation({
    mutationFn: (newData: Partial<Record<string, any>>) =>
      updateUserData(formPath, newData),
    onMutate: async (newData: Partial<Record<string, any>>) => {
      const previousData = queryClient.getQueryData<Record<string, any>>([
        'userData',
        userId,
        formPath
      ]);

      // Optimistically update cache with new data
      queryClient.setQueryData(
        ['userData', userId, formPath],
        (oldData: object) => ({
          ...(oldData as object),
          ...newData
        })
      );

      return { previousData };
    },
    onError: (error, _newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['userData', userId, formPath],
          context.previousData
        );
      }

      toast({
        title: 'Error',
        description: `Failed to update data: ${error.message}`,
        variant: 'destructive'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['userData', userId, formPath]
      });
    },
    onSuccess: () => {
      toast({
        title: 'Data Updated',
        description: 'Your data has been successfully updated.',
        variant: 'default'
      });
    }
  });

  useEffect(() => {
    if (userData) {
      form.reset(userData as T);
    } else {
      form.reset(defaultValues as DefaultValues<T>);
    }
  }, [userData, form, formPath, defaultValues]);

  async function onSubmit(data: T) {
    const partialData: Partial<Record<string, any>> = { ...data };
    mutation.mutate(partialData);
  }

  return { form, loading: isLoading, onSubmit };
}
