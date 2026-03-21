import en from './en'
import zh from './zh'
import ja from './ja'
import es from './es'
import fr from './fr'
import de from './de'
import ko from './ko'
import pt from './pt'
import ru from './ru'
import ar from './ar'
import it from './it'
import nl from './nl'
import tr from './tr'
import vi from './vi'
import th from './th'
import id from './id'
import hi from './hi'
import pl from './pl'
import sv from './sv'
import cs from './cs'
import ro from './ro'
import hu from './hu'
import uk from './uk'
import el from './el'

export type TranslationKey = keyof typeof en

const translations: Record<string, Record<TranslationKey, string>> = {
  English: en,
  Chinese: zh,
  Japanese: ja,
  Spanish: es,
  French: fr,
  German: de,
  Korean: ko,
  Portuguese: pt,
  Russian: ru,
  Arabic: ar,
  Italian: it,
  Dutch: nl,
  Turkish: tr,
  Vietnamese: vi,
  Thai: th,
  Indonesian: id,
  Hindi: hi,
  Polish: pl,
  Swedish: sv,
  Czech: cs,
  Romanian: ro,
  Hungarian: hu,
  Ukrainian: uk,
  Greek: el,
}

export function getTranslation(lang: string): (key: TranslationKey) => string {
  const dict = translations[lang] ?? en
  return (key: TranslationKey) => dict[key] ?? en[key] ?? key
}
