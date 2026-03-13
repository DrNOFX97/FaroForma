import React, { createContext, useContext, useState } from 'react';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('faroforma_lang');
    return (saved as Language) || 'pt';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('faroforma_lang', lang);
  };

  // Basic translation helper for UI strings
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['pt']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

const translations: Record<Language, Record<string, string>> = {
  pt: {
    'nav.contact': 'Contacte-nos',
    'nav.trainers': 'Quero ser Formador',
    'hero.ver_cursos': 'Ver Cursos',
    'hero.ver_servicos': 'Ver Serviços',
    'hero.falar_connosco': 'Falar Connosco',
    'tutoring.mark': 'Marcar explicação',
    'footer.rights': 'Todos os direitos reservados.',
    'footer.privacy': 'Política de Privacidade',
    'footer.terms': 'Termos de Uso',
    'contact.title': 'Contacte-nos',
    'contact.subtitle': 'Estamos aqui para ajudar o seu negócio ou percurso académico.',
    'contact.form.name': 'Nome Completo',
    'contact.form.email': 'Email Profissional',
    'contact.form.phone': 'Telemóvel / WhatsApp',
    'contact.form.subject': 'Assunto',
    'contact.form.message': 'Mensagem',
    'contact.form.send': 'Enviar Mensagem',
    'contact.form.sending': 'A enviar...',
    'contact.form.success': 'Mensagem enviada com sucesso!',
    'contact.form.error': 'Erro ao enviar. Tente novamente.',
    'student.form.title': 'Inscrição de Aluno',
    'student.form.subtitle': 'Preencha os seus dados para iniciar a sua formação.',
    'student.form.program': 'Programa de Interesse',
    'student.form.start': 'Previsão de Início',
    'student.form.preference': 'Preferência de Contacto',
    'student.form.notes': 'Notas Adicionais (opcional)',
    'student.form.register': 'Finalizar Inscrição',
    'trainer.nav.back': 'Voltar ao início',
    'admin.login.title': 'Backoffice FaroForma',
    'admin.login.subtitle': 'Área restrita para gestão de candidaturas e configurações.',
    'admin.login.button': 'Entrar com Google',
  },
  en: {
    'nav.contact': 'Contact Us',
    'nav.trainers': 'Become a Trainer',
    'hero.ver_cursos': 'View Courses',
    'hero.ver_servicos': 'View Services',
    'hero.falar_connosco': 'Talk to Us',
    'tutoring.mark': 'Book a session',
    'footer.rights': 'All rights reserved.',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Use',
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We are here to help your business or academic path.',
    'contact.form.name': 'Full Name',
    'contact.form.email': 'Professional Email',
    'contact.form.phone': 'Mobile / WhatsApp',
    'contact.form.subject': 'Subject',
    'contact.form.message': 'Message',
    'contact.form.send': 'Send Message',
    'contact.form.sending': 'Sending...',
    'contact.form.success': 'Message sent successfully!',
    'contact.form.error': 'Error sending. Please try again.',
    'student.form.title': 'Student Registration',
    'student.form.subtitle': 'Fill in your details to start your training.',
    'student.form.program': 'Program of Interest',
    'student.form.start': 'Estimated Start Date',
    'student.form.preference': 'Contact Preference',
    'student.form.notes': 'Additional Notes (optional)',
    'student.form.register': 'Complete Registration',
    'trainer.nav.back': 'Back to home',
    'admin.login.title': 'FaroForma Backoffice',
    'admin.login.subtitle': 'Restricted area for management and settings.',
    'admin.login.button': 'Sign in with Google',
  }
};
