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
    title: { pt: 'Formações Personalizadas em Faro', en: 'Customised Training in Faro' },
    desc: { 
      pt: 'Formações adaptadas às necessidades específicas dos nossos clientes em Faro, com conteúdos e metodologias personalizadas para máxima eficácia.', 
      en: 'Training adapted to the specific needs of our clients in Faro, with personalised content and methodologies for maximum effectiveness.' 
    },
  },
  {
    icon: <Users size={24} />,
    title: { pt: 'Aluguer de Sala de Reuniões em Faro', en: 'Meeting Room Hire in Faro' },
    desc: { 
      pt: 'Espaços modernos e bem equipados para reuniões de negócios no centro de Faro, com acesso a todo o equipamento audiovisual necessário.', 
      en: 'Modern and well-equipped spaces for business meetings in Faro city centre, with access to all necessary audiovisual equipment.' 
    },
  },
  {
    icon: <Building2 size={24} />,
    title: { pt: 'Aluguer de Sala de Formação em Faro', en: 'Training Room Hire in Faro' },
    desc: { 
      pt: 'Salas confortáveis e tecnicamente preparadas em Faro para hospedar as suas formações e eventos educacionais com total apoio logístico.', 
      en: 'Comfortable and technically prepared rooms in Faro to host your training sessions and educational events with full logistical support.' 
    },
  },
  {
    icon: <Briefcase size={24} />,
    title: { pt: 'Administração de Empresas em Faro', en: 'Business Administration in Faro' },
    desc: { 
      pt: 'Serviços especializados de administração em Faro que ajudam na organização eficiente das operações empresariais e na tomada de decisões.', 
      en: 'Specialised administration services in Faro that help in the efficient organisation of business operations and decision-making.' 
    },
  },
  {
    icon: <FileText size={24} />,
    title: { pt: 'Serviços Administrativos em Faro', en: 'Administrative Services in Faro' },
    desc: { 
      pt: 'Apoio completo em gestão administrativa, documentação e processos burocráticos para empresas em Faro, poupando tempo e recursos.', 
      en: 'Full support in administrative management, documentation and business bureaucratic processes in Faro, saving time and resources.' 
    },
  },
];
