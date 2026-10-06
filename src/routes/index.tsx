import { createFileRoute } from '@tanstack/react-router'
import { Header } from '../components/Header'
import { TenderLoader, TenderInfo } from '../components/TenderInfo'
import { FileUploader } from '../components/FileUploader'
import { RequirementsList } from '../components/RequirementsList'
import { PackageGenerator } from '../components/PackageGenerator'
import { useTender } from '../store/TenderContext'
import { useI18n } from '../i18n/I18nContext'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { tenderData } = useTender()
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!tenderData && <TenderLoader />}
        {!tenderData && (
          <p className="text-center text-gray-400">{t('noTenderLoaded')}</p>
        )}

        {tenderData && (
          <>
            <TenderInfo />
            <FileUploader />
            <RequirementsList />
            <PackageGenerator />
          </>
        )}
      </main>
    </div>
  )
}
