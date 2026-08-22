'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CircleInfo } from '@gravity-ui/icons';
import { Button, Card, Form, InputGroup, Label, Tabs, TextField } from '@heroui/react';
import { useI18n } from '../i18n-provider';
import { ProfileAvatar } from './profile-avatar';

interface ProfileSetupProps {
  initialValue?: string;
  isBusy?: boolean;
  onSubmit: (nickname: string) => void | Promise<void>;
}

export function ProfileSetup({ initialValue = '', isBusy = false, onSubmit }: ProfileSetupProps) {
  const { t } = useI18n();
  const [nickname, setNickname] = useState(initialValue);

  useEffect(() => setNickname(initialValue), [initialValue]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(nickname.trim() || '익명');
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] w-full items-center bg-[var(--palette-surface-page)] px-4 py-8 text-[var(--palette-text-primary)]">
      <Card className="mx-auto w-full max-w-5xl overflow-hidden border border-[var(--palette-border-subtle)] bg-[var(--palette-surface-card)] p-0 shadow-[0_18px_50px_rgba(47,107,69,0.12)]">
        <Form autoComplete="off" className="grid min-h-[440px] w-full md:grid-cols-[minmax(240px,0.8fr)_minmax(360px,1.2fr)]" onSubmit={submit}>
          <section className="grid min-h-40 place-items-center border-b border-[var(--palette-border-accent-soft)] bg-[linear-gradient(145deg,var(--palette-surface-tint),var(--palette-illustration-green-light))] px-8 py-10 md:min-h-full md:border-r md:border-b-0">
            <p className="text-center text-3xl font-extrabold tracking-tight text-[var(--palette-green-900)] sm:text-4xl">
              {t('appName')}
            </p>
          </section>

          <section className="flex min-w-0 flex-col justify-center bg-[var(--palette-surface-card)] px-6 py-8 sm:px-10 md:px-12">
            <Tabs defaultSelectedKey="guest" className="w-full">
              <Tabs.ListContainer className="w-full rounded-xl bg-[var(--palette-control-surface)] p-1">
                <Tabs.List className="grid w-full grid-cols-2 text-[var(--palette-text-secondary)]">
                  <Tabs.Tab id="guest" className="font-bold">
                    {t('guestProfile')}
                    <Tabs.Indicator className="bg-[var(--palette-surface-card)] shadow-sm" />
                  </Tabs.Tab>
                  <Tabs.Tab id="social" className="font-bold">
                    {t('socialLogin')}
                    <Tabs.Indicator className="bg-[var(--palette-surface-card)] shadow-sm" />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel id="guest" className="min-h-[360px] pt-2">
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-6 py-5">
                  <header className="text-center">
                    <h1 className="text-2xl font-extrabold text-[var(--palette-text-primary)] sm:text-3xl">{t('nicknameWelcomeTitle')}</h1>
                  </header>
                  <ProfileAvatar
                    nickname={nickname || '익명'}
                    className="size-28 border-4 border-[var(--palette-border-accent-soft)] bg-[var(--palette-surface-muted)] shadow-[0_8px_24px_rgba(79,164,99,0.18)] sm:size-32"
                  />
                  <TextField className="w-full" name="nickname">
                    <Label className="text-base font-normal text-[var(--palette-text-primary)]">{t('nickname')}</Label>
                    <InputGroup className="border-[var(--palette-border-accent-soft)] bg-[var(--palette-surface-soft)] outline-none ring-0 focus-within:border-default focus-within:outline-none focus-within:ring-0 data-[focused=true]:border-default data-[focused=true]:outline-none data-[focused=true]:ring-0">
                      <InputGroup.Input
                        autoFocus
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        className="w-full border-0 text-[var(--palette-text-primary)] outline-none ring-0 placeholder:text-[var(--palette-text-muted)] focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                        data-1p-ignore
                        data-lpignore="true"
                        maxLength={12}
                        placeholder="익명"
                        spellCheck={false}
                        type="text"
                        value={nickname}
                        onChange={(event) => setNickname(event.target.value)}
                      />
                    </InputGroup>
                  </TextField>
                  <Button className="w-full bg-[var(--palette-green-600)] font-extrabold text-white shadow-[0_8px_20px_rgba(79,164,99,0.25)] hover:bg-[var(--palette-green-700)]" type="submit" isDisabled={isBusy}>
                    {t('continue')}
                  </Button>
                </div>
              </Tabs.Panel>

              <Tabs.Panel id="social" className="min-h-[360px] pt-2">
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-[var(--palette-border-subtle)] bg-[var(--palette-surface-soft)] px-6 py-10 text-center">
                  <CircleInfo className="size-10 text-[var(--palette-text-muted)]" aria-hidden="true" />
                  <p className="font-description text-sm text-[var(--palette-text-secondary)]">{t('socialLoginUnavailable')}</p>
                </div>
              </Tabs.Panel>
            </Tabs>
          </section>
        </Form>
      </Card>
    </main>
  );
}
