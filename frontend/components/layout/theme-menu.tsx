'use client';

import { useTheme } from '@heroui/react';
import { Moon, Sun, Monitor } from 'pixelarticons/react';
import { useI18n } from '../i18n-provider';
import { Button } from '../ui/button';
import { Dropdown } from '../ui/dropdown';

const THEMES = [
  { id: 'light', Icon: Sun, labelKey: 'themeLight' },
  { id: 'dark', Icon: Moon, labelKey: 'themeDark' },
  { id: 'system', Icon: Monitor, labelKey: 'themeSystem' },
] as const;

export function ThemeMenu() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme('dark');

  const CurrentIcon = THEMES.find(({ id }) => id === theme)?.Icon ?? Monitor;

  return (
    <Dropdown>
      <Button isIconOnly variant="tertiary" aria-label={t('theme')}>
        <CurrentIcon className="size-5" aria-hidden="true" />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu aria-label={t('theme')} selectedKey={theme} onSelect={setTheme}>
          {THEMES.map(({ id, Icon, labelKey }) => (
            <Dropdown.Item key={id} id={id} textValue={t(labelKey)}>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {t(labelKey)}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
