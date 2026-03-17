import { PHONE_NUMBERS } from './contactInfo';

export type CourseHighlightIcon = 'MessageCircle' | 'Users' | 'Award' | 'Bullseye';

export interface CourseHighlight {
  text: { pt: string, en: string };
  icon: CourseHighlightIcon;
}

export const COURSE_INFO = {
  title: { pt: 'Cursos de Português (PLA) para Estrangeiros', en: 'Portuguese Courses (PLA) for Foreigners' },
  subtitle: { pt: 'Centro de Formação de Faro - FaroForma', en: 'Faro Training Centre - FaroForma' },
  status: { pt: 'Inscrições Abertas | Níveis A1 + A2', en: 'Open Enrolment | Levels A1 + A2' },
  description: { 
    pt: 'Formação PLA acreditada com foco na comunicação prática para o dia a dia, trabalho e integração em Portugal.', 
    en: 'Accredited PLA training with a focus on practical communication for daily life, work, and integration in Portugal.' 
  },
  highlights: [
    { 
      text: { pt: 'Certificado válido para fins de nacionalidade e residência.', en: 'Valid certificate for nationality and residence purposes.' }, 
      icon: 'Award' 
    },
    { 
      text: { pt: 'Foco na comunicação oral para o dia a dia e trabalho.', en: 'Focus on oral communication for daily life and work.' }, 
      icon: 'MessageCircle' 
    },
    { 
      text: { pt: 'Turmas pequenas com apoio personalizado à integração.', en: 'Small classes with personalized integration support.' }, 
      icon: 'Users' 
    },
  ] as CourseHighlight[],
  schedule: [
    { turma: { pt: 'Turma A', en: 'Class A' }, período: { pt: 'Manhã', en: 'Morning' }, horário: '09:00 – 12:00', dias: { pt: '2ª a 6ª feira', en: 'Mon to Fri' } },
    { turma: { pt: 'Turma B', en: 'Class B' }, período: { pt: 'Tarde', en: 'Afternoon' }, horário: '14:00 – 17:00', dias: { pt: '2ª a 6ª feira', en: 'Mon to Fri' } },
    { turma: { pt: 'Turma C', en: 'Class C' }, período: { pt: 'Noite', en: 'Evening' }, horário: '19:00 – 22:00', dias: { pt: '2ª a 6ª feira', en: 'Mon to Fri' } },
    { turma: { pt: 'Turma D', en: 'Class D' }, período: { pt: 'Sábado Intensivo', en: 'Intensive Saturday' }, horário: '09:00 – 13:00 / 14:00 – 18:00', dias: { pt: 'Sábado', en: 'Saturday' } },
  ],
  contact: {
    phones: PHONE_NUMBERS,
    email: 'faroforma@gmail.com',
    website: 'www.faroforma.pt',
  },
};
