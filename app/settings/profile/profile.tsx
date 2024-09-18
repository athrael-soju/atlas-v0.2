'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormSelect } from '@/components/form-select';
import { Searching } from '@/components/spinner';
import { ButtonLoading } from '@/components/button-loading';
import { profileFormSchema, ProfileFormValues } from '@/lib/form-schema';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import {
  countryOptions,
  genderOptions,
  languageOptions,
  militaryStatusOptions,
  occupationOptions,
  technicalAptitudeOptions
} from '@/constants/profile';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const defaultValues: ProfileFormValues = {
  firstName: '',
  lastName: '',
  preferredLanguage: 'en_US',
  personalizedResponses: false
};

export function ProfileForm(): React.ReactElement {
  const { form, loading, onSubmit } = useFetchAndSubmit<ProfileFormValues>({
    schema: profileFormSchema,
    defaultValues,
    formPath: 'settings.profile'
  });

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
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Doe" {...field} />
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
                    placeholder="john@doe.com"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        new Date(field.value).toLocaleDateString()
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const localDate = new Date(date.setHours(0, 0, 0, 0));
                          field.onChange(localDate.toISOString().split('T')[0]);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
            name="gender"
            render={({ field }) => (
              <FormSelect
                label="Gender"
                options={genderOptions}
                value={field.value || ''}
                onChange={(val) => form.setValue('gender', val)}
                placeholder="Select gender"
                description="Select your gender"
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

          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormSelect
                label="Occupation"
                options={occupationOptions}
                value={field.value || ''}
                onChange={(val) => form.setValue('occupation', val)}
                placeholder="Select occupation"
                description="Select your occupation"
              />
            )}
          />

          <FormField
            control={form.control}
            name="technicalAptitude"
            render={({ field }) => (
              <FormSelect
                label="Technical Aptitude"
                options={technicalAptitudeOptions}
                value={field.value || ''}
                onChange={(val) => form.setValue('technicalAptitude', val)}
                placeholder="Select your technical aptitude level"
                description="Rate your technical skills from beginner to expert"
              />
            )}
          />

          <FormField
            control={form.control}
            name="militaryStatus"
            render={({ field }) => (
              <FormSelect
                label="Military Status"
                options={militaryStatusOptions}
                value={field.value || ''}
                onChange={(val) => form.setValue('militaryStatus', val)}
                placeholder="Select military status"
                description="Select your military status"
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
                  Enable this option to personalize assistant responses based on
                  your profile.
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
