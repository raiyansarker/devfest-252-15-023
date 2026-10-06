import { useI18n } from '../i18n/I18nContext';

export function Header() {
  const { t, lang, setLang } = useI18n();

  return (
    <header className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <h1 className="text-xl font-bold">{t('appTitle')}</h1>
      <button
        onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
        className="px-4 py-1.5 bg-white text-blue-700 rounded font-medium hover:bg-blue-50 transition-colors cursor-pointer"
      >
        {t('language')}
      </button>
    </header>
  );
}
