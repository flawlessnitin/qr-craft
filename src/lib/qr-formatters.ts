export type ContentType = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi' | 'vcard';

export interface ContentTypeConfig {
  id: ContentType;
  label: string;
  icon: string;
  fields: FieldConfig[];
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'url' | 'tel' | 'textarea' | 'select' | 'password';
  placeholder: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

export const CONTENT_TYPES: ContentTypeConfig[] = [
  {
    id: 'url',
    label: 'URL',
    icon: '🔗',
    fields: [
      {
        name: 'url',
        label: 'Website URL',
        type: 'url',
        placeholder: 'https://example.com',
        required: true,
      },
    ],
  },
  {
    id: 'text',
    label: 'Text',
    icon: '📝',
    fields: [
      {
        name: 'text',
        label: 'Text Content',
        type: 'textarea',
        placeholder: 'Enter your text here...',
        required: true,
      },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    icon: '✉️',
    fields: [
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        placeholder: 'name@example.com',
        required: true,
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        placeholder: 'Email subject (optional)',
      },
      {
        name: 'body',
        label: 'Body',
        type: 'textarea',
        placeholder: 'Email body (optional)',
      },
    ],
  },
  {
    id: 'phone',
    label: 'Phone',
    icon: '📱',
    fields: [
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '+1 234 567 8900',
        required: true,
      },
    ],
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: '💬',
    fields: [
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '+1 234 567 8900',
        required: true,
      },
      {
        name: 'message',
        label: 'Message',
        type: 'textarea',
        placeholder: 'Your message (optional)',
      },
    ],
  },
  {
    id: 'wifi',
    label: 'WiFi',
    icon: '📶',
    fields: [
      {
        name: 'ssid',
        label: 'Network Name (SSID)',
        type: 'text',
        placeholder: 'MyWiFiNetwork',
        required: true,
      },
      {
        name: 'password',
        label: 'Password',
        type: 'password',
        placeholder: 'Network password',
      },
      {
        name: 'encryption',
        label: 'Encryption',
        type: 'select',
        placeholder: '',
        options: [
          { value: 'WPA', label: 'WPA/WPA2' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'None' },
        ],
      },
    ],
  },
  {
    id: 'vcard',
    label: 'Contact',
    icon: '👤',
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        placeholder: 'John',
        required: true,
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        placeholder: 'Doe',
      },
      {
        name: 'phone',
        label: 'Phone',
        type: 'tel',
        placeholder: '+1 234 567 8900',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'john@example.com',
      },
      {
        name: 'organization',
        label: 'Organization',
        type: 'text',
        placeholder: 'Company name',
      },
    ],
  },
];

/**
 * Escape special characters for WiFi QR code format.
 */
function escapeWifi(str: string): string {
  return str.replace(/([\\;,:"'])/g, '\\$1');
}

/**
 * Format form data into a QR-scannable payload string based on content type.
 */
export function formatPayload(
  type: ContentType,
  data: Record<string, string>
): string {
  switch (type) {
    case 'url':
      return data.url || '';

    case 'text':
      return data.text || '';

    case 'email': {
      if (!data.email) return '';
      const params: string[] = [];
      if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
      if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
      return `mailto:${data.email}${params.length ? '?' + params.join('&') : ''}`;
    }

    case 'phone':
      return data.phone ? `tel:${data.phone}` : '';

    case 'sms': {
      if (!data.phone) return '';
      return data.message
        ? `sms:${data.phone}?body=${encodeURIComponent(data.message)}`
        : `sms:${data.phone}`;
    }

    case 'wifi': {
      if (!data.ssid) return '';
      const enc = data.encryption || 'WPA';
      const pass = data.password ? `P:${escapeWifi(data.password)}` : '';
      return `WIFI:T:${enc};S:${escapeWifi(data.ssid)};${pass};;`;
    }

    case 'vcard': {
      if (!data.firstName) return '';
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${data.lastName || ''};${data.firstName};;;`,
        `FN:${data.firstName}${data.lastName ? ' ' + data.lastName : ''}`,
      ];
      if (data.phone) lines.push(`TEL:${data.phone}`);
      if (data.email) lines.push(`EMAIL:${data.email}`);
      if (data.organization) lines.push(`ORG:${data.organization}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }

    default:
      return '';
  }
}
