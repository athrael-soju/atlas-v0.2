import { useEffect, useMemo, useCallback } from 'react';
import { DefaultValues, FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { fetchUserData, updateUserData } from '@/lib/service/user';

// Parameters for useUserForm to make it generic
interface UseUserFormParams<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  formPath: string;
}

// Updated useUserForm hook
export function useUserForm<T extends FieldValues>({
  schema,
  defaultValues,
  formPath
}: UseUserFormParams<T>) {
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

  // Reset the form whenever the userData changes
  useEffect(() => {
    if (userData && !form.formState.isDirty) {
      form.reset(userData);
    } else if (!userData) {
      form.reset(defaultValues);
    }
  }, [userData, form, defaultValues]);

  // Enhanced onSubmit function
  const onSubmit = useCallback(
    (data: T) => {
      const partialData: Partial<Record<string, any>> = data.conversations
        ? data.conversations
        : { ...data };

      mutation.mutate(partialData);
    },
    [mutation]
  );

  return { form, loading: isLoading, onSubmit, userData };
}
