'use client';

import type { ComponentProps, ReactNode } from 'react';
import {
  Description,
  FieldError,
  Label,
  TextField as HeroTextField,
} from '@heroui/react';
import { createUIComponent } from './base';

const TextFieldRoot = createUIComponent(HeroTextField, [
  'w-full',
  'gap-2',
]);

interface TextFieldProps extends Omit<ComponentProps<typeof HeroTextField>, 'children'> {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  children: ReactNode;
}

export function TextField({
  label,
  description,
  errorMessage,
  children,
  isInvalid,
  ...props
}: TextFieldProps) {
  const invalid = isInvalid ?? Boolean(errorMessage);

  return (
    <TextFieldRoot isInvalid={invalid} {...props}>
      <Label>{label}</Label>
      {children}
      {description && !invalid && (
        <Description>{description}</Description>
      )}
      {errorMessage && <FieldError>{errorMessage}</FieldError>}
    </TextFieldRoot>
  );
}
