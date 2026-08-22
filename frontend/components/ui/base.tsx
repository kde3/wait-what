'use client';

import { createElement, type ComponentProps, type ElementType } from 'react';
import { twMerge } from 'tailwind-merge';

type ClassName = string | ((values: any) => string);

export function createUIComponent<C extends ElementType>(
  Component: C,
  classes: string[],
) {
  type Props = ComponentProps<C>;

  const baseClassName = twMerge(classes.join(' '));

  return function UIComponent(props: Props) {
    const { className, ...restProps } = props as Props & {
      className?: ClassName;
    };

    const mergedClassName =
      typeof className === 'function'
        ? (values: any) => twMerge(baseClassName, className(values))
        : twMerge(baseClassName, className);

    return createElement(Component, {
      ...restProps,
      className: mergedClassName,
    } as any);
  };
}
