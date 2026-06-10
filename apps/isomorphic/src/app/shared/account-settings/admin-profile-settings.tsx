'use client';

import { useEffect, useRef, useState } from 'react';
import { Input, Button, Avatar, Title, Text, Loader } from 'rizzui';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  PiUserDuotone,
  PiEnvelopeDuotone,
  PiLockKeyDuotone,
  PiImageSquareDuotone,
  PiUploadDuotone,
  PiTrashDuotone,
  PiCheckCircleDuotone,
  PiClockDuotone,
} from 'react-icons/pi';
import { useAuth } from '@/hooks/useAuth';
import { adminProfileService, LockBackground } from '@/services/admin-profile';

export default function AdminProfileSettings() {
  const { currentUser } = useAuth();
  const admin = currentUser as any;

  return (
    <div className="@container space-y-6 pb-10">
      <ProfileCard admin={admin} />
      <IdentitySection initialName={admin?.name ?? ''} initialEmail={admin?.email ?? ''} />
      <PasswordSection />
      <LockScreenSection />
    </div>
  );
}

function ProfileCard({ admin }: { admin: any }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
      <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
        <Avatar
          src="/avatar.webp"
          name={admin?.name ?? t('profile_settings.admin_fallback')}
          size="xl"
          className="-mt-12 !h-24 !w-24 border-4 border-white shadow-lg"
        />
        <div className="flex-1">
          <Title as="h3" className="text-xl font-semibold text-gray-900">
            {admin?.name ?? t('profile_settings.admin_fallback')}
          </Title>
          <Text className="text-sm text-gray-500">{admin?.email}</Text>
          {admin?.role && (
            <span className="mt-1 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {admin.role}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  icon, title, description, children,
}: { icon: React.ReactNode; title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
        <div>
          <Title as="h4" className="text-base font-semibold text-gray-900">{title}</Title>
          {description && <Text className="text-sm text-gray-500">{description}</Text>}
        </div>
      </div>
      {children}
    </div>
  );
}

function IdentitySection({ initialName, initialEmail }: { initialName: string; initialEmail: string }) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setName(initialName); }, [initialName]);
  useEffect(() => { setEmail(initialEmail); }, [initialEmail]);

  const save = async () => {
    if (!name.trim() || !email.trim()) { toast.error(t('profile_settings.name_email_required')); return; }
    setSaving(true);
    try {
      await adminProfileService.updateProfile({ name: name.trim(), email: email.trim() });
      toast.success(t('profile_settings.updated'));
    } catch (e: any) {
      toast.error(e?.message ?? t('profile_settings.update_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      icon={<PiUserDuotone className="h-5 w-5" />}
      title={t('profile_settings.identity_title')}
      description={t('profile_settings.identity_desc')}
    >
      <div className="grid gap-4 @md:grid-cols-2">
        <Input
          label={t('profile_settings.name_label')}
          prefix={<PiUserDuotone className="h-5 w-5 text-gray-400" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label={t('profile_settings.email_label')}
          type="email"
          prefix={<PiEnvelopeDuotone className="h-5 w-5 text-gray-400" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={save} isLoading={saving}>{t('common.save')}</Button>
      </div>
    </Section>
  );
}

function PasswordSection() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!current || !pwd) { toast.error(t('profile_settings.all_fields_required')); return; }
    if (pwd.length < 8) { toast.error(t('profile_settings.password_min')); return; }
    if (pwd !== pwd2) { toast.error(t('profile_settings.password_mismatch')); return; }
    setSaving(true);
    try {
      await adminProfileService.changePassword({
        current_password: current,
        new_password: pwd,
        new_password_confirmation: pwd2,
      });
      toast.success(t('profile_settings.password_updated'));
      setCurrent(''); setPwd(''); setPwd2('');
    } catch (e: any) {
      toast.error(e?.message ?? t('profile_settings.generic_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section
      icon={<PiLockKeyDuotone className="h-5 w-5" />}
      title={t('profile_settings.password_title')}
      description={t('profile_settings.password_desc')}
    >
      <div className="grid gap-4 @md:grid-cols-3">
        <Input type="password" label={t('profile_settings.current_password')} value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Input type="password" label={t('profile_settings.new_password')} value={pwd} onChange={(e) => setPwd(e.target.value)} />
        <Input type="password" label={t('profile_settings.confirm_password')} value={pwd2} onChange={(e) => setPwd2(e.target.value)} />
      </div>
      <div className="mt-5 flex justify-end">
        <Button onClick={submit} isLoading={saving}>{t('profile_settings.change_password_btn')}</Button>
      </div>
    </Section>
  );
}

interface BackgroundWithPreview extends LockBackground {
  previewUrl?: string;
}

function LockScreenSection() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState(8);
  const [backgrounds, setBackgrounds] = useState<BackgroundWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [savingInterval, setSavingInterval] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await adminProfileService.getLockScreenSettings();
        if (!alive) return;
        setInterval(data.interval);
        const withBlobs: BackgroundWithPreview[] = await Promise.all(
          data.backgrounds.map(async (b) => {
            try { return { ...b, previewUrl: await adminProfileService.fetchBackgroundBlobUrl(b.filename) }; }
            catch { return { ...b }; }
          })
        );
        if (!alive) return;
        setBackgrounds(withBlobs);
      } catch (e: any) {
        toast.error(e?.message ?? t('profile_settings.load_images_failed'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      setBackgrounds((curr) => {
        curr.forEach((b) => b.previewUrl && URL.revokeObjectURL(b.previewUrl));
        return curr;
      });
    };
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const res = await adminProfileService.uploadLockScreenBackgrounds(Array.from(files));
      const updated: BackgroundWithPreview[] = await Promise.all(
        res.backgrounds.map(async (b) => {
          const existing = backgrounds.find((x) => x.filename === b.filename);
          if (existing?.previewUrl) return existing;
          try { return { ...b, previewUrl: await adminProfileService.fetchBackgroundBlobUrl(b.filename) }; }
          catch { return { ...b }; }
        })
      );
      backgrounds.forEach((b) => {
        if (b.previewUrl && !updated.some((u) => u.filename === b.filename)) URL.revokeObjectURL(b.previewUrl);
      });
      setBackgrounds(updated);
      toast.success(t(files.length > 1 ? 'profile_settings.images_added_other' : 'profile_settings.images_added_one', { count: files.length }));
    } catch (e: any) {
      toast.error(e?.message ?? t('profile_settings.upload_failed'));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const deleteBg = async (filename: string) => {
    if (!confirm(t('profile_settings.delete_image_confirm'))) return;
    try {
      await adminProfileService.deleteLockScreenBackground(filename);
      setBackgrounds((curr) => {
        const target = curr.find((b) => b.filename === filename);
        if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
        return curr.filter((b) => b.filename !== filename);
      });
      toast.success(t('profile_settings.image_deleted'));
    } catch (e: any) {
      toast.error(e?.message ?? t('profile_settings.generic_failed'));
    }
  };

  const saveInterval = async (value: number) => {
    setSavingInterval(true);
    try {
      await adminProfileService.updateLockScreenSettings({ interval: value });
      toast.success(t('profile_settings.interval_updated'));
    } catch (e: any) {
      toast.error(e?.message ?? t('profile_settings.generic_failed'));
    } finally {
      setSavingInterval(false);
    }
  };

  return (
    <Section
      icon={<PiImageSquareDuotone className="h-5 w-5" />}
      title={t('profile_settings.lock_title')}
      description={t('profile_settings.lock_desc')}
    >
      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <PiClockDuotone className="h-5 w-5 text-gray-500" />
          <Text className="font-medium text-gray-800">{t('profile_settings.rotation_interval')}</Text>
          {savingInterval && <Loader size="sm" />}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value))}
            onMouseUp={(e) => saveInterval(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => saveInterval(Number((e.target as HTMLInputElement).value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
          />
          <span className="min-w-[80px] text-right text-sm font-mono font-medium text-gray-700">
            {interval === 0 ? t('profile_settings.disabled') : `${interval}s`}
          </span>
        </div>
        <Text className="mt-2 text-xs text-gray-500">{t('profile_settings.interval_hint')}</Text>
      </div>

      <div className="mb-5">
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          variant="outline"
          onClick={() => fileInput.current?.click()}
          isLoading={uploading}
        >
          <PiUploadDuotone className="me-2 h-4 w-4" />
          {t('profile_settings.add_images')}
        </Button>
        <Text className="mt-2 text-xs text-gray-500">{t('profile_settings.upload_hint')}</Text>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader />
        </div>
      ) : backgrounds.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <PiImageSquareDuotone className="mx-auto mb-2 h-10 w-10 text-gray-400" />
          <Text className="text-sm text-gray-500">{t('profile_settings.no_custom_images')}</Text>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 @md:grid-cols-3 @2xl:grid-cols-4">
          {backgrounds.map((bg) => (
            <div
              key={bg.filename}
              className="group relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm"
            >
              {bg.previewUrl ? (
                <img
                  src={bg.previewUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  {t('profile_settings.preview_unavailable')}
                </div>
              )}
              <button
                type="button"
                onClick={() => deleteBg(bg.filename)}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 opacity-0 shadow transition group-hover:opacity-100 hover:bg-white"
                aria-label={t('common.delete')}
                title={t('common.delete')}
              >
                <PiTrashDuotone className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                <div className="flex items-center gap-1 text-[10px] font-medium text-white">
                  <PiCheckCircleDuotone className="h-3 w-3" /> {t('profile_settings.active_short')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
