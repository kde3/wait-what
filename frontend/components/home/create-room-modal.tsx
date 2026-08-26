'use client';

import { useEffect, useState } from 'react';
import { FieldError, Input, Label, Radio, RadioGroup, TextField } from '@heroui/react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { useI18n } from '../i18n-provider';

interface CreateRoomModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  suggestedName: string;
  busy?: boolean;
  error?: string;
  onCreate: (name: string, password: string) => void | Promise<void>;
}

export function CreateRoomModal({ isOpen, onOpenChange, suggestedName, busy = false, error = '', onCreate }: CreateRoomModalProps) {
  const { t } = useI18n();
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [roomPasswordError, setRoomPasswordError] = useState('');
  const [roomVisibility, setRoomVisibility] = useState('public');

  useEffect(() => {
    if (!isOpen) return;
    setRoomName('');
    setRoomPassword('');
    setRoomPasswordError('');
    setRoomVisibility('public');
  }, [isOpen]);

  function create() {
    if (roomVisibility === 'private' && !roomPassword) {
      setRoomPasswordError(t('errRoomPasswordRequired'));
      return;
    }
    onCreate(roomName.trim() || suggestedName, roomVisibility === 'private' ? roomPassword : '');
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t('createRoomTitle')}
      bodyClassName="gap-0"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={create} isDisabled={busy}>
            {t('create')}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <RadioGroup
          value={roomVisibility}
          onChange={(value) => {
            setRoomVisibility(value);
            if (value === 'public') {
              setRoomPassword('');
              setRoomPasswordError('');
            }
          }}
          className="grid grid-cols-2 gap-3"
          aria-label={t('roomVisibility')}
        >
          <Radio value="public">
            <Radio.Control><Radio.Indicator /></Radio.Control>
            <Radio.Content>{t('publicRoom')}</Radio.Content>
          </Radio>
          <Radio value="private">
            <Radio.Control><Radio.Indicator /></Radio.Control>
            <Radio.Content>{t('privateRoom')}</Radio.Content>
          </Radio>
        </RadioGroup>
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium">{t('roomName')}</label>
          <Input
            type="text"
            maxLength={30}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={suggestedName}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>
        {roomVisibility === 'private' && (
          <TextField fullWidth isInvalid={Boolean(roomPasswordError)} isRequired name="roomPassword" type="password" className="gap-2">
            <Label>{t('roomPassword')}</Label>
            <Input
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              data-bwignore
              type="password"
              maxLength={32}
              placeholder={t('roomPasswordCreateHint')}
              value={roomPassword}
              onChange={(event) => {
                setRoomPassword(event.target.value);
                if (roomPasswordError) setRoomPasswordError('');
              }}
            />
            <FieldError>{roomPasswordError}</FieldError>
          </TextField>
        )}
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
      </div>
    </Modal>
  );
}

export default CreateRoomModal;
