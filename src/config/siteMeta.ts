import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const DEFAULT_SITE_META = {
  title: 'FaroForma | Formação, apoio administrativo e explicações em Faro',
  description:
    'FaroForma oferece formações personalizadas, apoio administrativo e explicações desde o secundário até à universidade.',
  keywords: 'formação, Faro, explicações, administração, aluguer salas',
  contactEmail: 'faroforma@gmail.com',
};

export async function getSiteMeta() {
  try {
    const d = await getDoc(doc(db, 'config', 'siteMeta'));
    if (d.exists()) {
      return { ...DEFAULT_SITE_META, ...d.data() };
    }
  } catch (err) {
    console.error('Error fetching dynamic site meta:', err);
  }
  return DEFAULT_SITE_META;
}

export default DEFAULT_SITE_META;
