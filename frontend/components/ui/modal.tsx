'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Modal as HeroModal } from '@heroui/react';

interface ModalProps {
  isOpen: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  isDismissable?: boolean;
  title: ReactNode;
  size?: ComponentProps<typeof HeroModal.Container>['size'];
  showCloseButton?: boolean;
  footer?: ReactNode;
  dialogClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Modal({
  isOpen,
  onOpenChange,
  isDismissable,
  title,
  size = 'sm',
  showCloseButton = false,
  footer,
  dialogClassName,
  bodyClassName,
  children,
}: ModalProps) {
  return (
    <HeroModal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={isDismissable}>
      <HeroModal.Container size={size} placement="center">
        <HeroModal.Dialog className={dialogClassName}>
          {showCloseButton && <HeroModal.CloseTrigger />}
          <HeroModal.Header>
            <HeroModal.Heading>{title}</HeroModal.Heading>
          </HeroModal.Header>
          <HeroModal.Body className={bodyClassName}>{children}</HeroModal.Body>
          {footer && <HeroModal.Footer>{footer}</HeroModal.Footer>}
        </HeroModal.Dialog>
      </HeroModal.Container>
    </HeroModal.Backdrop>
  );
}
