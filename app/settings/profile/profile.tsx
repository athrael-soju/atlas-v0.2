'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Searching } from '@/components/spinner';
import { profileFormSchema, ProfileFormValues } from '@/lib/form-schema';
import { FormSelect } from '@/components/form-select';
import { countryOptions, languageOptions } from '@/constants/profile';
import { IUser } from '@/models/User';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const defaultValues: Partial<ProfileFormValues> = {
  preferredLanguage: 'en_US',
  personalizedResponses: false
};

// ButtonLoading Component to show loading spinner
export function ButtonLoading() {
  return (
    <Button disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Please wait
    </Button>
  );
}

export function ProfileForm() {
  const { data: session } = useSession();
  const user = session?.user;
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues
  });

  useEffect(() => {
    if (userId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/user', { method: 'GET' });
          if (response.ok) {
            const result = await response.json();
            if (result?.settings?.profile) {
              form.reset(result.settings.profile);
            } else {
              form.reset(defaultValues);
            }
          } else {
            toast({
              title: 'Error',
              description: 'Request failed. Please try again.',
              variant: 'destructive'
            });
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
  }, [form, userId]);

  async function onSubmit(data: ProfileFormValues) {
    const partialData: Partial<IUser> = { settings: { profile: data } };
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialData.settings)
      });

      if (response.ok) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Request failed. Please try again.',
          variant: 'destructive'
        });
        form.reset(defaultValues);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `${error}`,
        variant: 'destructive'
      });
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <Searching />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="johndoe@gmail.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="contactNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Number</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter your contact number"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="countryOfOrigin"
            render={({ field }) => (
              <FormSelect
                label="Country of Origin"
                options={countryOptions}
                value={field.value || ''}
                onChange={(val) => form.setValue('countryOfOrigin', val)}
                placeholder="Select country"
                description="Select your country of origin"
              />
            )}
          />

          <FormField
            control={form.control}
            name="preferredLanguage"
            render={({ field }) => (
              <FormSelect
                label="Preferred Language"
                options={languageOptions}
                value={field.value}
                onChange={(val) => form.setValue('preferredLanguage', val)}
                placeholder="Select language"
                description="Select your preferred language"
              />
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="personalizedResponses"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Personalized Responses
                </FormLabel>
                <FormDescription>
                  Enable this option to use your profile information to
                  personalize responses.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {loading ? (
          <ButtonLoading />
        ) : (
          <Button type="submit" style={{ width: '100%' }}>
            Update Profile
          </Button>
        )}
      </form>
    </Form>
  );
}
