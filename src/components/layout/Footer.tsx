import { MapPin, Phone, Mail } from 'lucide-react';
import { PHONE_NUMBERS } from '../../data/contactInfo';
import logo from '../../assets/images/logo.png';
import { useLanguage } from '../../context/LanguageContext';

const SERVICE_LINKS_LIST = [
  { pt: 'Formações Personalizadas', en: 'Customised Training' },
  { pt: 'Aluguer de Salas', en: 'Room Hire' },
  { pt: 'Administração de Empresas', en: 'Business Administration' },
  { pt: 'Serviços Administrativos', en: 'Administrative Services' },
  { pt: 'Explicações', en: 'Tutoring' },
];


export default function Footer() {
  const { language, t } = useLanguage();
  
  const scrollTo = (href: string) => {
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <div className="footer__accent-line" />
      <div className="container">
        <div className="footer__grid" style={{ paddingTop: '3rem' }}>
          {/* Brand */}
          <div>
            <div className="footer__brand-logo">
              <img src={logo} alt="FaroForma" className="footer__logo-img" />
            </div>
            <p className="footer__brand-text">
              {language === 'pt' 
                ? 'Formações personalizadas, apoio administrativo e explicações em Faro. Qualidade e experiência ao seu serviço desde 2009.'
                : 'Customised training, administrative support and tutoring in Faro. Quality and experience at your service since 2009.'}
            </p>
          </div>

          {/* Services */}
          <div>
            <p className="footer__col-title">{language === 'pt' ? 'Serviços' : 'Services'}</p>
            <div className="footer__links">
              {SERVICE_LINKS_LIST.map(s => (
                <button key={s.pt} className="footer__link" onClick={() => scrollTo('#servicos')}>
                  {s[language]}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="footer__col-title">{language === 'pt' ? 'Contacto' : 'Contact'}</p>
            <div className="footer__contact-item">
              <MapPin size={14} />
              <span>
                {language === 'pt' 
                  ? <>Rua Conselheiro Sebastião Teles 2A<br />8000-256 Faro</>
                  : <>2A Rua Conselheiro Sebastião Teles<br />8000-256 Faro, Portugal</>}
              </span>
            </div>
            <div className="footer__contact-item">
              <Phone size={14} />
              <span>
                {PHONE_NUMBERS.map((num, idx) => (
                  <span key={num}>
                    <a href={`tel:${num.replace(/\s/g, '')}`} style={{ color: 'inherit' }}>
                      {num}
                    </a>
                    {idx < PHONE_NUMBERS.length - 1 && ' · '}
                  </span>
                ))}
              </span>
            </div>
            <div className="footer__contact-item">
              <Mail size={14} />
              <a href="mailto:faroforma@gmail.com" style={{ color: 'inherit' }}>faroforma@gmail.com</a>
            </div>
          </div>
        </div>

        <div className="footer__bar">
          <p className="footer__bar-left">
            © 2026 FaroForma. {t('footer.rights')}
          </p>
          <div className="footer__bar-right">
            <button className="footer__bar-link">{t('footer.privacy')}</button>
            <button className="footer__bar-link">{t('footer.terms')}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
