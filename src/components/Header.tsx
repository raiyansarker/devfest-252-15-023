import { useI18n } from '../i18n/I18nContext';
import { useTender, useTenderDispatch } from '../store/TenderContext';

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { tenderData } = useTender();
  const dispatch = useTenderDispatch();

  return (
    <header className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <h1 className="text-xl font-bold">{t('appTitle')}</h1>
      <div className="flex gap-4">
        {tenderData && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to start over? All uploaded files will be lost.')) {
                dispatch({ type: 'RESET_STATE' });
              }
            }}
            className="px-4 py-1.5 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors cursor-pointer"
          >
            Start Over
          </button>
        )}
        <button
          onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
          className="px-4 py-1.5 bg-white text-blue-700 rounded font-medium hover:bg-blue-50 transition-colors cursor-pointer"
        >
          {t('language')}
        </button>
      </div>
    </header>
  );
}
