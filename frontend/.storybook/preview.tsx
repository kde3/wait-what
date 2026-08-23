import type { Preview } from '@storybook/react-vite';
import { I18nProvider } from '../components/i18n-provider';
import '../app/globals.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <I18nProvider>
        <Story />
      </I18nProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'todo' },
    controls: { expanded: true },
    backgrounds: { default: 'app' },
  },
};

export default preview;
