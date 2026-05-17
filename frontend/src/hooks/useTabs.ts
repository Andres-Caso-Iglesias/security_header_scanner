import { useState } from 'react';

type TabId = 'headers' | 'compliance' | 'tls' | 'dns' | 'sri' | 'fingerprint' | 'sensitive' | 'recommendations';

const TABS: { id: TabId; label: string }[] = [
  { id: 'headers', label: 'Headers' },
  { id: 'compliance', label: 'Cumplimiento' },
  { id: 'tls', label: 'TLS/SSL' },
  { id: 'dns', label: 'DNS' },
  { id: 'sri', label: 'SRI' },
  { id: 'fingerprint', label: 'Fingerprinting' },
  { id: 'sensitive', label: 'Sensibles' },
  { id: 'recommendations', label: 'Recomendaciones' },
];

interface UseTabsReturn {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  tabs: typeof TABS;
}

export function useTabs(): UseTabsReturn {
  const [activeTab, setActiveTab] = useState<TabId>('headers');
  return { activeTab, setActiveTab, tabs: TABS };
}
