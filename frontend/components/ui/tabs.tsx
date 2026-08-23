'use client';

import { Tabs as HeroTabs } from '@heroui/react';
import { createUIComponent } from './base';

const Root = createUIComponent(HeroTabs, ['w-full', '[--focus:var(--palette-secondary-strong)]']);
const ListContainer = createUIComponent(HeroTabs.ListContainer, [
  'w-full',
  'bg-[var(--palette-control-tint)]',
  'p-1',
]);
const List = createUIComponent(HeroTabs.List, ['grid', 'w-full', 'text-[var(--palette-text-secondary)]']);
const Tab = createUIComponent(HeroTabs.Tab, [
  'font-bold',
  'data-[selected=true]:text-white',
]);
const Indicator = createUIComponent(HeroTabs.Indicator, ['bg-[var(--palette-secondary-strong)]']);
const Panel = createUIComponent(HeroTabs.Panel, []);

export const Tabs = Object.assign(Root, { ListContainer, List, Tab, Indicator, Panel });
