import { format } from 'date-fns';
import { de, fr } from 'date-fns/locale';

/** The date of an article in a list: "09. April 2026", in French "9 avril 2026" */
export const formatListDate = (date: string, language?: string) =>
  language === 'fr' ?
    format(new Date(date), 'd MMMM yyyy', { locale: fr })
  : format(new Date(date), 'dd. MMMM yyyy', { locale: de });
