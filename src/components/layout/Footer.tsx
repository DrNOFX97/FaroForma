import { MapPin, Phone, Mail } from 'lucide-react';
import { PHONE_NUMBERS } from '../../data/contactInfo';
import logo from '../../assets/images/logo.png';

const SERVICE_LINKS = [
  'Formações Personalizadas',
  'Aluguer de Salas',
  'Administração de Empresas',
  'Serviços Administrativos',
  'Explicações',
];


export default function Footer() {
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
              <img src={logo} alt="FaroForma (Centro FaroForma)" className="footer__logo-img" />
            </div>
            <p className="footer__brand-text">
              Formações personalizadas, apoio administrativo e explicações em Faro.
              Qualidade e experiência ao seu serviço desde 2009.
            </p>
          </div>

          {/* Services */}
          <div>
            <p className="footer__col-title">Serviços</p>
            <div className="footer__links">
              {SERVICE_LINKS.map(s => (
                <button key={s} className="footer__link" onClick={() => scrollTo('#servicos')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="footer__col-title">Contacto</p>
            <div className="footer__contact-item">
              <MapPin size={14} />
              <span>Rua Conselheiro Sebastião Teles 2A<br />8000-256 Faro</span>
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
            © 2026 FaroForma. Todos os direitos reservados.
          </p>
          <div className="footer__bar-right">
            <button className="footer__bar-link">Política de Privacidade</button>
            <button className="footer__bar-link">Termos de Uso</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
