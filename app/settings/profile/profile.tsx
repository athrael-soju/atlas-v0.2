'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SelectSetting } from '../select';
import { Searching } from '@/components/spinner';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import {
  countryOptions,
  genderOptions,
  languageOptions,
  militaryStatusOptions,
  occupationOptions,
  technicalAptitudeOptions
} from '@/constants/profile';
import {
  Calendar as CalendarIcon,
  Globe,
  User,
  Flag,
  Briefcase,
  Settings,
  Shield,
  Cpu
} from 'lucide-react'; // Imported icons from Lucide
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { profileFormSchema, ProfileFormValues } from '@/lib/form-schema';
import { SettingCard } from '../card'; // Assuming you have a SettingCard component
import { Card } from '@/components/ui/card';

const defaultValues: Partial<ProfileFormValues> = {
  firstName: '',
  lastName: '',
  preferredLanguage: 'en_US',
  personalizedResponses: false
};

export function ProfileForm() {
  const { form, loading, onSubmit } = useFetchAndSubmit<ProfileFormValues>({
    schema: profileFormSchema,
    defaultValues,
    formPath: 'settings.profile'
  });

  const [saving, setSaving] = useState(false); // Track the saving state

  // Handle form submission on button click
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSubmit(form.getValues() as ProfileFormValues); // Submit form data
    } finally {
      setSaving(false); // Reset saving state after submission
    }
  };

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <Searching />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label>First Name</label>
          <Input
            disabled={loading}
            placeholder="John"
            value={form.watch('firstName') ?? ''} // Provide empty string if undefined
            onChange={(e) => form.setValue('firstName', e.target.value)}
          />
        </div>

        <div>
          <label>Last Name</label>
          <Input
            disabled={loading}
            placeholder="Doe"
            value={form.watch('lastName') ?? ''} // Provide empty string if undefined
            onChange={(e) => form.setValue('lastName', e.target.value)}
          />
        </div>

        <div>
          <label>Email</label>
          <Input
            disabled={loading}
            placeholder="john@doe.com"
            value={form.watch('email') ?? ''} // Provide empty string if undefined
            onChange={(e) => form.setValue('email', e.target.value)}
          />
        </div>

        <div>
          <label>Date of Birth</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch('dateOfBirth') ? (
                  new Date(
                    form.watch('dateOfBirth') as string
                  ).toLocaleDateString()
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={
                  form.watch('dateOfBirth')
                    ? new Date(form.watch('dateOfBirth') as string)
                    : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    const localDate = new Date(
                      date.getFullYear(),
                      date.getMonth(),
                      date.getDate(),
                      12
                    );
                    form.setValue('dateOfBirth', localDate.toISOString());
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Setting Cards for Profile Form with Icon */}
        <SettingCard
          icon={<Globe className="h-8 w-8 text-primary" />} // Country Icon
          title="Country of Origin"
          description="Select your country of origin"
        >
          <SelectSetting
            options={countryOptions}
            value={form.watch('countryOfOrigin') as string}
            onValueChange={(val) => form.setValue('countryOfOrigin', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<User className="h-8 w-8 text-primary" />} // Gender Icon
          title="Gender"
          description="Select your gender"
        >
          <SelectSetting
            options={genderOptions}
            value={form.watch('gender') as string}
            onValueChange={(val) => form.setValue('gender', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<Flag className="h-8 w-8 text-primary" />} // Language Icon
          title="Preferred Language"
          description="Select your preferred language"
        >
          <SelectSetting
            options={languageOptions}
            value={form.watch('preferredLanguage') as string}
            onValueChange={(val) => form.setValue('preferredLanguage', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<Briefcase className="h-8 w-8 text-primary" />} // Occupation Icon
          title="Occupation"
          description="Select your occupation"
        >
          <SelectSetting
            options={occupationOptions}
            value={form.watch('occupation') as string}
            onValueChange={(val) => form.setValue('occupation', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<Settings className="h-8 w-8 text-primary" />} // Technical Aptitude Icon
          title="Technical Aptitude"
          description="Select your technical aptitude"
        >
          <SelectSetting
            options={technicalAptitudeOptions}
            value={form.watch('technicalAptitude') as string}
            onValueChange={(val) => form.setValue('technicalAptitude', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<Shield className="h-8 w-8 text-primary" />} // Military Status Icon
          title="Military Status"
          description="Select your military status"
        >
          <SelectSetting
            options={militaryStatusOptions}
            value={form.watch('militaryStatus') as string}
            onValueChange={(val) => form.setValue('militaryStatus', val)}
          />
        </SettingCard>
      </div>

      <Card className="grid gap-4">
        <div className=" flex items-center space-x-4 rounded-md border p-4">
          <Cpu className="h-8 w-8 text-primary" />

          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">
              Personalized Responses
            </p>
            <p className="text-sm text-muted-foreground">
              Enable to personalize assistant responses based on your profile.
            </p>
          </div>
          <Switch
            checked={form.watch('personalizedResponses')}
            onCheckedChange={(val) =>
              form.setValue('personalizedResponses', val)
            }
            title="Personalized Responses"
          />
        </div>
      </Card>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={saving}
          variant="default"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
