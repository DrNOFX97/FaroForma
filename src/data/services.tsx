import type { ReactElement } from 'react';
import { GraduationCap, Building2, Users, Briefcase, FileText } from 'lucide-react';

export interface ServiceCard {
  title: { pt: string, en: string };
  desc: { pt: string, en: string };
  icon: ReactElement;
}

export const SERVICES: ServiceCard[] = [
  {
    icon: <GraduationCap size={24} />, 
    title: { pt: 'Formações Personalizadas', en: 'Customised Training' },
    desc: { 
      pt: 'Formações adaptadas às necessidades específicas dos nossos clientes, com conteúdos e metodologias personalizadas para máxima eficácia.', 
      en: 'Training adapted to the specific needs of our clients, with personalised content and methodologies for maximum effectiveness.' 
    },
  },
  {
    icon: <Users size={24} />,
    title: { pt: 'Aluguer de Sala para Reuniões', en: 'Meeting Room Hire' },
    desc: { 
      pt: 'Espaços modernos e bem equipados para reuniões de negócios, com acesso a todo o equipamento audiovisual necessário.', 
      en: 'Modern and well-equipped spaces for business meetings, with access to all necessary audiovisual equipment.' 
    },
  },
  {
    icon: <Building2 size={24} />,
    title: { pt: 'Aluguer de Sala para Formações', en: 'Training Room Hire' },
    desc: { 
      pt: 'Salas confortáveis e tecnicamente preparadas para hospedar as suas formações e eventos educacionais com total apoio logístico.', 
      en: 'Comfortable and technically prepared rooms to host your training sessions and educational events with full logistical support.' 
    },
  },
  {
    icon: <Briefcase size={24} />,
    title: { pt: 'Administração de Empresas', en: 'Business Administration' },
    desc: { 
      pt: 'Serviços especializados de administração que ajudam na organização eficiente das operações empresariais e na tomada de decisões.', 
      en: 'Specialised administration services that help in the efficient organisation of business operations and decision-making.' 
    },
  },
  {
    icon: <FileText size={24} />,
    title: { pt: 'Serviços Administrativos', en: 'Administrative Services' },
    desc: { 
      pt: 'Apoio completo em gestão administrativa, documentação e processos burocráticos das empresas, poupando tempo e recursos.', 
      en: 'Full support in administrative management, documentation and business bureaucratic processes, saving time and resources.' 
    },
  },
];
