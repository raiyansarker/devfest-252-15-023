import { useI18n } from '../i18n/I18nContext';
import type { RequirementStatus } from '../types/tender';

const statusConfig: Record<
  RequirementStatus,
  { labelKey: 'missing' | 'expiryDateNeeded' | 'expired' | 'notProvided' | 'ok'; color: string }
> = {
  missing: { labelKey: 'missing', color: 'bg-red-100 text-red-700' },
  expiry_date_needed: { labelKey: 'expiryDateNeeded', color: 'bg-orange-100 text-orange-700' },
  expired: { labelKey: 'expired', color: 'bg-red-100 text-red-700' },
  not_provided: { labelKey: 'notProvided', color: 'bg-gray-100 text-gray-500' },
  ok: { labelKey: 'ok', color: 'bg-green-100 text-green-700' },
};

export function StatusBadge({ status }: { status: RequirementStatus }) {
  const { t } = useI18n();
  const cfg = statusConfig[status];

  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${cfg.color}`}>
      {t(cfg.labelKey)}
    </span>
  );
}
