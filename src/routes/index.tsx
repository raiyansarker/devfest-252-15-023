import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { TenderLoader, TenderInfo } from '../components/TenderInfo'
import { FileUploader } from '../components/FileUploader'
import { SignatureUploader } from '../components/SignatureUploader'
import { RequirementsList } from '../components/RequirementsList'
import { PackageGenerator } from '../components/PackageGenerator'
import { useTender } from '../store/TenderContext'
import { useI18n } from '../i18n/I18nContext'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { tenderData } = useTender()
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-900 selection:text-white">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!tenderData && <TenderLoader />}
        {!tenderData && (
          <p className="text-center text-gray-400">{t('noTenderLoaded')}</p>
        )}

        {tenderData && (
          <div className="flex flex-col gap-6">
            <TenderInfo />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-full">
                <FileUploader />
              </div>
              <div className="h-full">
                <SignatureUploader />
              </div>
            </div>
            <RequirementsList />
            <PackageGenerator />
          </div>
        )}
      </main>
    </div>
  )
}
