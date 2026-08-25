'use client';

import { SyntheticEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { InfoBox } from 'pixelarticons/react';
import { Card, Form, InputGroup, Label, TextField } from '@heroui/react';
import { Tabs } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { useI18n } from '../components/i18n-provider';
import { ProfileAvatar } from '../components/home/profile-avatar';

interface ProfileSetupProps {
  initialValue?: string;
  isBusy?: boolean;
  onSubmit: (nickname: string) => void | Promise<void>;
}

export function ProfileSetup({ initialValue = '', isBusy = false, onSubmit }: ProfileSetupProps) {
  const { t } = useI18n();
  const [nickname, setNickname] = useState(initialValue);

  useEffect(() => setNickname(initialValue), [initialValue]);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(nickname.trim() || '익명');
  }

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] w-full items-center bg-background px-4 py-8 text-foreground">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 md:grid-cols-[minmax(240px,0.8fr)_minmax(360px,1.2fr)]">
        <section className="grid place-items-center px-4 py-6 md:py-10">
            <Image
              src="/images/logo.png"
              alt={t('appName')}
              width={3966}
              height={1586}
              priority
              sizes="200px"
              className="h-auto w-full max-w-[200px]"
            />
          </section>

          <Card className="min-w-0 overflow-hidden border border-[var(--palette-border-subtle)] bg-surface p-0 shadow-[0_18px_50px_color-mix(in_srgb,var(--palette-ink)_12%,transparent)]">
            <Form
              autoComplete="off"
              className="flex min-h-[440px] min-w-0 flex-col justify-center px-6 py-8 sm:px-10 md:px-12"
              onSubmit={submit}
            >
            <Tabs defaultSelectedKey="guest">
              <Tabs.ListContainer>
                <Tabs.List className="grid-cols-2">
                  <Tabs.Tab id="guest">
                    {t('guestProfile')}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="social">
                    {t('socialLogin')}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel id="guest" className="min-h-[360px] pt-2">
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-6 py-5">
                  <header className="text-center">
                    <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{t('nicknameWelcomeTitle')}</h1>
                  </header>
                  <ProfileAvatar
                    changeable
                    changeLabel={t('changeProfile')}
                    nickname={nickname || '익명'}
                    className="size-28 border-4 border-[var(--palette-border-accent-soft)] bg-surface-tertiary shadow-[0_8px_24px_color-mix(in_srgb,var(--palette-primary-strong)_18%,transparent)] sm:size-32"
                  />
                  <TextField className="w-full" name="nickname">
                    <Label className="text-base font-normal text-foreground">{t('nickname')}</Label>
                    <InputGroup className="border-[var(--palette-border-accent-soft)] bg-surface-secondary outline-none ring-0 focus-within:border-default focus-within:outline-none focus-within:ring-0">
                      <InputGroup.Input
                        autoFocus
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        className="w-full border-0 text-foreground outline-none ring-0 placeholder:text-[var(--palette-text-muted)] focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
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
                  <Button className="w-full bg-[var(--palette-primary-strong)] font-extrabold text-white shadow-[0_8px_20px_color-mix(in_srgb,var(--palette-primary-strong)_25%,transparent)] hover:bg-[var(--palette-secondary-strong)]" type="submit" isDisabled={isBusy}>
                    {t('continue')}
                  </Button>
                </div>
              </Tabs.Panel>

              <Tabs.Panel id="social" className="min-h-[360px] pt-2">
                <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 rounded-xl border border-[var(--palette-border-subtle)] bg-surface-secondary px-6 py-10 text-center">
                  <InfoBox className="size-10 text-[var(--palette-text-muted)]" aria-hidden="true" />
                  <p className="font-description text-sm text-[var(--palette-text-secondary)]">{t('socialLoginUnavailable')}</p>
                </div>
              </Tabs.Panel>
            </Tabs>
            </Form>
          </Card>
      </div>
    </main>
  );
}
