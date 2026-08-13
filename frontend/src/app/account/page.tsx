'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function ProfilePage(): JSX.Element {
  const { user, setUser } = useAuthStore();

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' },
  });

  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  const updateProfile = useMutation({
    mutationFn: (v: ProfileValues) => api.auth.updateProfile(v),
    onSuccess: (u) => {
      setUser(u);
      toast.success('Profile updated');
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const changePassword = useMutation({
    mutationFn: (v: PasswordValues) => api.auth.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      toast.success('Password changed');
      passwordForm.reset();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Personal information</h2>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={profileForm.handleSubmit((v) => updateProfile.mutate(v))}
        >
          <div className="space-y-1.5">
            <Label>First name</Label>
            <Input {...profileForm.register('firstName')} />
          </div>
          <div className="space-y-1.5">
            <Label>Last name</Label>
            <Input {...profileForm.register('lastName')} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Phone</Label>
            <Input {...profileForm.register('phone')} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={updateProfile.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Change password</h2>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={passwordForm.handleSubmit((v) => changePassword.mutate(v))}
        >
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Current password</Label>
            <Input type="password" {...passwordForm.register('currentPassword')} />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type="password" {...passwordForm.register('newPassword')} />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input type="password" {...passwordForm.register('confirmPassword')} />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" loading={changePassword.isPending}>
              Update password
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
