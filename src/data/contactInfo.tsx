import type { ReactElement } from 'react';
import { MapPin, Phone, Globe, Mail } from 'lucide-react';

export const PHONE_NUMBERS = ['289 820 831', '91 781 23 79', '96 240 95 70'];

export interface ContactCard {
  icon: ReactElement;
  label: string;
  value: string;
  isPhone?: boolean;
  isLink?: boolean;
  href?: string;
}

export const CONTACT_CARDS: ContactCard[] = [
  {
    icon: <MapPin size={18} />,
    label: 'Morada',
    value: 'Rua Conselheiro Sebastião Teles 2A\n8000-256 Faro',
  },
  {
    icon: <Phone size={18} />,
    label: 'Telefone',
    value: PHONE_NUMBERS.join('\n'),
    isPhone: true,
  },
  {
    icon: <Mail size={18} />,
    label: 'Email',
    value: 'faroforma@gmail.com',
    isLink: true,
    href: 'mailto:faroforma@gmail.com',
  },
  {
    icon: <Globe size={18} />,
    label: 'Website',
    value: 'www.formafaro.online',
    isLink: true,
    href: 'https://www.formafaro.online',
  },
];
