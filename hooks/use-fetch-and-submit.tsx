import { useState, useEffect } from 'react';
import { DefaultValues, FieldValues, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { IUser } from '@/models/User';

export function useUserForm<T extends FieldValues>(
  schema: any,
  defaultValues: Partial<T>,
  formPath: keyof IUser['settings']
) {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id;
  const [loading, setLoading] = useState(true);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>
  });

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/user', { method: 'GET' });
          if (response.ok) {
            const result = await response.json();
            const formSettings = result?.settings?.[formPath];

            if (formSettings) {
              form.reset(formSettings);
            } else {
              form.reset(defaultValues as DefaultValues<T>);
            }
          } else {
            toast({
              title: 'Error',
              description: 'Request failed. Please try again.',
              variant: 'destructive'
            });
            form.reset(defaultValues as DefaultValues<T>);
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: `${error}`,
            variant: 'destructive'
          });
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [defaultValues, form, formPath, userId]);

  async function onSubmit(data: T) {
    const partialData: Partial<IUser> = { settings: { [formPath]: data } };

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialData.settings)
      });
      // Check if the form data is not for the sidebar or knowledgebase
      if (
        !data.hasOwnProperty('sidebarExpanded') &&
        !data.hasOwnProperty('knowledgebaseEnabled')
      ) {
        if (response.ok) {
          toast({
            title: 'Settings Updated',
            description: 'Your settings have been successfully updated.',
            variant: 'default'
          });
        } else {
          toast({
            title: 'Error',
            description: 'Request failed. Please try again.',
            variant: 'destructive'
          });
          form.reset(defaultValues as DefaultValues<T>);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  }

  return { form, loading, onSubmit };
}
