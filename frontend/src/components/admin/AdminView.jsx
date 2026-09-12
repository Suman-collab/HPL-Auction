import React from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import LiveAuctionView from '../auction/LiveAuctionView';
import TeamManagement from '../teams/TeamManagement';
import PlayerManagement from '../players/PlayerManagement';
import SetManagement from '../sets/SetManagement';
import GlobalOverridePanel from '../override/GlobalOverridePanel';
import AuditLogView from '../audit/AuditLogView';

export default function AdminView() {
  const { activeTab } = useAuctionStore();

  return (
    <div className="w-full">
      {activeTab === 'live' && <LiveAuctionView />}
      {activeTab === 'teams' && <TeamManagement />}
      {activeTab === 'players' && <PlayerManagement />}
      {activeTab === 'sets' && <SetManagement />}
      {activeTab === 'override' && <GlobalOverridePanel />}
      {activeTab === 'audit' && <AuditLogView />}
    </div>
  );
}
