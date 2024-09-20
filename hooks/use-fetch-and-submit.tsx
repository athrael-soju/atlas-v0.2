import { useEffect, useMemo, useCallback } from 'react';
import { DefaultValues, FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

// Parameters for useFetchAndSubmit to make it generic
interface UseFetchAndSubmitParams<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  formPath: string;
}

const fetchUserData = async (path: string): Promise<any> => {
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

const updateUserData = async (path: string, data: any): Promise<void> => {
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

// Updated useFetchAndSubmit hook
export function useFetchAndSubmit<T extends FieldValues>({
  schema,
  defaultValues,
  formPath
}: UseFetchAndSubmitParams<T>) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const queryClient = useQueryClient();

  const memoizedDefaultValues = useMemo(() => defaultValues, [defaultValues]);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: memoizedDefaultValues
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
      // TODO: Show only on relevant errors
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
      // TODO: Same as above
      toast({
        title: 'Data Updated',
        description: 'Your data has been successfully updated.',
        variant: 'default'
      });
    }
  });

  // Reset the form whenever the userData changes
  useEffect(() => {
    if (userData) {
      // Only reset if userData is available and form is not dirty to prevent overwriting unsaved changes
      if (!form.formState.isDirty) {
        form.reset(userData);
      }
    } else if (!form.formState.isDirty) {
      // Reset to default values only when there's no userData and the form is clean
      form.reset(defaultValues);
    }
  }, [userData, form, defaultValues]);

  // Enhanced onSubmit function
  const onSubmit = useCallback(
    (data: T) => {
      const partialData: Partial<Record<string, any>> = { ...data };
      mutation.mutate(partialData);
    },
    [mutation]
  );

  return { form, loading: isLoading, onSubmit, userData };
}
