import { PHONE_NUMBERS } from './contactInfo';

export type CourseHighlightIcon = 'MessageCircle' | 'Users' | 'Award' | 'Bullseye';

export interface CourseHighlight {
  text: string;
  icon: CourseHighlightIcon;
}

export const COURSE_INFO = {
  title: 'Cursos de Português (PLA) para Estrangeiros',
  subtitle: 'Centro de Formação de Faro - FaroForma',
  status: 'Inscrições Abertas | Níveis A1 + A2',
  description:
    'Formação PLA acreditada com foco na comunicação prática para o dia a dia, trabalho e integração em Portugal.',
  highlights: [
    { text: 'Foco: Comunicação prática para o dia a dia, trabalho e integração em Portugal.', icon: 'MessageCircle' },
    { text: 'Vagas: Limitadas.', icon: 'Users' },
    { text: 'Certificação: Inclui certificado de frequência.', icon: 'Award' },
    { text: 'Objetivo: Melhora a tua integração.', icon: 'Bullseye' },
  ] as CourseHighlight[],
  schedule: [
    { turma: 'Turma A', período: 'Manhã', horário: '09:00 – 12:00', dias: '2ª a 6ª feira' },
    { turma: 'Turma B', período: 'Tarde', horário: '14:00 – 17:00', dias: '2ª a 6ª feira' },
    { turma: 'Turma C', período: 'Noite', horário: '19:00 – 22:00', dias: '2ª a 6ª feira' },
    { turma: 'Turma D', período: 'Sábado Intensivo', horário: '09:00 – 13:00 / 14:00 – 18:00', dias: 'Sábado' },
  ],
  contact: {
    phones: PHONE_NUMBERS,
    email: 'faroforma@gmail.com',
    website: 'www.faroforma.pt',
  },
};
