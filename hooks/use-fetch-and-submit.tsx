import { useEffect } from 'react';
import { DefaultValues, FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { IUser } from '@/models/User';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

async function fetchUserSettings(): Promise<IUser['settings']> {
  const response = await fetch('/api/user', { method: 'GET' });
  if (!response.ok) {
    throw new Error('Failed to fetch user settings');
  }
  const result = await response.json();
  return result.settings;
}

async function updateUserSettings(
  settings: Partial<IUser['settings']>
): Promise<void> {
  const response = await fetch('/api/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!response.ok) {
    throw new Error('Failed to update user settings');
  }
}

interface UseUserFormParams<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues: DefaultValues<T>;
  formPath: keyof IUser['settings'];
}

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

  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['userSettings', userId],
    queryFn: fetchUserSettings,
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: updateUserSettings,
    onMutate: async (newSettings: Partial<IUser['settings']>) => {
      await queryClient.invalidateQueries({
        queryKey: ['userSettings', userId]
      });

      const previousSettings = queryClient.getQueryData<IUser['settings']>([
        'userSettings',
        userId
      ]);

      // Optimistically update cache with new settings
      queryClient.setQueryData(
        ['userSettings', userId],
        (oldSettings: object) => ({
          ...(oldSettings as object),
          ...newSettings
        })
      );

      return { previousSettings };
    },
    onError: (error, _newSettings, context) => {
      // Rollback to previous settings on error
      if (context?.previousSettings) {
        queryClient.setQueryData(
          ['userSettings', userId],
          context.previousSettings
        );
      }

      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings', userId] });
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Your settings have been successfully updated.',
        variant: 'default'
      });
    }
  });

  useEffect(() => {
    if (userSettings) {
      const formSettings = userSettings[formPath] as unknown as T;
      if (formSettings) {
        form.reset(formSettings);
      } else {
        form.reset(defaultValues as DefaultValues<T>);
      }
    }
  }, [userSettings, form, formPath, defaultValues]);

  async function onSubmit(data: T) {
    const partialData: Partial<IUser['settings']> = { [formPath]: data };
    mutation.mutate(partialData);
  }

  return { form, loading: isLoading, onSubmit };
}
