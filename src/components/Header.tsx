import { useI18n } from '../i18n/I18nContext';
import { useTender, useTenderDispatch } from '../store/TenderContext';

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { tenderData } = useTender();
  const dispatch = useTenderDispatch();

  return (
    <header className="bg-zinc-950 text-white px-6 py-4 flex items-center justify-between border-b border-zinc-800">
      <h1 className="text-xl font-bold tracking-tight">{t('appTitle')}</h1>
      <div className="flex gap-4">
        {tenderData && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to start over? All uploaded files will be lost.')) {
                dispatch({ type: 'RESET_STATE' });
              }
            }}
            className="px-5 py-1.5 bg-white text-zinc-900 rounded-full font-medium hover:bg-zinc-200 transition-colors cursor-pointer text-sm shadow-sm"
          >
            Start Over
          </button>
        )}
        <button
          onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
          className="px-5 py-1.5 bg-zinc-800 text-zinc-100 rounded-full font-medium hover:bg-zinc-700 transition-colors cursor-pointer text-sm shadow-sm border border-zinc-700"
        >
          {t('language')}
        </button>
      </div>
    </header>
  );
}
