import type { ReactElement } from 'react';
import { GraduationCap, Building2, Users, Briefcase, FileText } from 'lucide-react';

export interface ServiceCard {
  title: string;
  desc: string;
  icon: ReactElement;
}

export const SERVICES: ServiceCard[] = [
  {
    icon: <GraduationCap size={24} />, 
    title: 'Formações Personalizadas',
    desc: 'Formações adaptadas às necessidades específicas dos nossos clientes, com conteúdos e metodologias personalizadas para máxima eficácia.',
  },
  {
    icon: <Users size={24} />,
    title: 'Aluguer de Sala para Reuniões',
    desc: 'Espaços modernos e bem equipados para reuniões de negócios, com acesso a todo o equipamento audiovisual necessário.',
  },
  {
    icon: <Building2 size={24} />,
    title: 'Aluguer de Sala para Formações',
    desc: 'Salas confortáveis e tecnicamente preparadas para hospedar as suas formações e eventos educacionais com total apoio logístico.',
  },
  {
    icon: <Briefcase size={24} />,
    title: 'Administração de Empresas',
    desc: 'Serviços especializados de administração que ajudam na organização eficiente das operações empresariais e na tomada de decisões.',
  },
  {
    icon: <FileText size={24} />,
    title: 'Serviços Administrativos',
    desc: 'Apoio completo em gestão administrativa, documentação e processos burocráticos das empresas, poupando tempo e recursos.',
  },
];
