'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SelectSetting } from '../select';
import { useFetchAndSubmit } from '@/hooks/use-fetch-and-submit';
import { ProfileFormSkeleton } from './skeleton';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { profileFormSchema, ProfileFormValues } from '@/lib/form-schema';
import { SettingCard } from '../card';
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

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      onSubmit(form.getValues() as ProfileFormValues);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProfileFormSkeleton />;
  }

  return (
    <div className="container mx-auto space-y-8 py-10">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <div>
          <Input
            disabled={loading}
            placeholder="First Name"
            value={form.watch('firstName') ?? ''}
            onChange={(e) => form.setValue('firstName', e.target.value)}
          />
        </div>

        <div>
          <Input
            disabled={loading}
            placeholder="Last Name"
            value={form.watch('lastName') ?? ''}
            onChange={(e) => form.setValue('lastName', e.target.value)}
          />
        </div>

        <div>
          <Input
            disabled={loading}
            placeholder="Email"
            value={form.watch('email') ?? ''}
            onChange={(e) => form.setValue('email', e.target.value)}
          />
        </div>

        <div>
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
                {form.watch('dateOfBirth')
                  ? new Date(
                      form.watch('dateOfBirth') as string
                    ).toLocaleDateString()
                  : 'Pick a date'}
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

        <SettingCard
          icon={<Globe className="h-8 w-8 text-primary" />}
          title="Country of Origin"
        >
          <SelectSetting
            options={countryOptions}
            value={form.watch('countryOfOrigin') as string}
            onValueChange={(val) => form.setValue('countryOfOrigin', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<User className="h-8 w-8 text-primary" />}
          title="Gender"
        >
          <SelectSetting
            options={genderOptions}
            value={form.watch('gender') as string}
            onValueChange={(val) => form.setValue('gender', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<Flag className="h-8 w-8 text-primary" />}
          title="Preferred Language"
        >
          <SelectSetting
            options={languageOptions}
            value={form.watch('preferredLanguage') as string}
            onValueChange={(val) => form.setValue('preferredLanguage', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<Briefcase className="h-8 w-8 text-primary" />}
          title="Occupation"
        >
          <SelectSetting
            options={occupationOptions}
            value={form.watch('occupation') as string}
            onValueChange={(val) => form.setValue('occupation', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<Settings className="h-8 w-8 text-primary" />}
          title="Technical Aptitude"
        >
          <SelectSetting
            options={technicalAptitudeOptions}
            value={form.watch('technicalAptitude') as string}
            onValueChange={(val) => form.setValue('technicalAptitude', val)}
          />
        </SettingCard>

        <SettingCard
          icon={<Shield className="h-8 w-8 text-primary" />}
          title="Military Status"
        >
          <SelectSetting
            options={militaryStatusOptions}
            value={form.watch('militaryStatus') as string}
            onValueChange={(val) => form.setValue('militaryStatus', val)}
          />
        </SettingCard>
      </div>

      <Card className="grid gap-4">
        <div className="flex items-center space-x-4 rounded-md border p-4">
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
