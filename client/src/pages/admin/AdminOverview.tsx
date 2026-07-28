import { useState } from 'react';
import { useAdminMerchants, useUpdateMerchantStatus, useAuditLogs } from '../../api/hooks';
import { getErrorMessage } from '../../lib/api';

export function AdminOverview() {
  const [activeTab, setActiveTab] = useState<'merchants' | 'audit'>('merchants');

  return (
    <div className="page-container max-w-7xl animate-fade-in pb-14">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-50">Admin</h1>
        <p className="text-sm text-surface-400 mt-1">Manage platform operations.</p>
      </div>

      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab('merchants')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'merchants' ? 'bg-surface-800 text-surface-200' : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          Merchants
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'audit' ? 'bg-surface-800 text-surface-200' : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          Audit logs
        </button>
      </div>

      {activeTab === 'merchants' ? <MerchantsTab /> : <AuditLogsTab />}
    </div>
  );
}

function MerchantsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { data, isLoading } = useAdminMerchants({ status: statusFilter });
  const updateMutation = useUpdateMerchantStatus();

  const handleUpdateStatus = (id: string, newStatus: 'approved' | 'suspended') => {
    if (confirm(`Mark this merchant as ${newStatus}?`)) {
      updateMutation.mutate({ id, status: newStatus }, {
        onError: (err) => alert(getErrorMessage(err)),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {['pending', 'approved', 'suspended', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
              statusFilter === status ? 'bg-surface-800 text-surface-200' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-surface-400 text-sm">Loading...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="p-12 text-center text-surface-400 text-sm">No {statusFilter} merchants.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-700 text-surface-400 text-xs">
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Address</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/50">
                {data.data.map(merchant => (
                  <tr key={merchant._id} className="hover:bg-surface-800/30">
                    <td className="px-5 py-4">
                      <div className="font-medium text-surface-100">{merchant.businessName}</div>
                    </td>
                    <td className="px-5 py-4 text-surface-400">
                      <div>{merchant.phone}</div>
                      <div className="text-xs">{typeof merchant.userId === 'object' ? merchant.userId.email : ''}</div>
                    </td>
                    <td className="px-5 py-4 text-surface-400 max-w-xs truncate">{merchant.address}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {merchant.verificationStatus !== 'approved' && (
                          <button onClick={() => handleUpdateStatus(merchant._id, 'approved')} className="btn-primary btn-sm" disabled={updateMutation.isPending}>
                            Approve
                          </button>
                        )}
                        {merchant.verificationStatus !== 'suspended' && (
                          <button onClick={() => handleUpdateStatus(merchant._id, 'suspended')} className="btn-danger btn-sm" disabled={updateMutation.isPending}>
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditLogsTab() {
  const { data, isLoading } = useAuditLogs({ page: 1 });

  return (
    <div className="card overflow-hidden">
      {isLoading ? (
        <div className="p-12 text-center text-surface-400 text-sm">Loading...</div>
      ) : !data || data.data.length === 0 ? (
        <div className="p-12 text-center text-surface-400 text-sm">No audit logs.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-surface-400 text-xs">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Actor</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50 font-mono text-xs">
              {data.data.map((log: any) => (
                <tr key={log._id} className="hover:bg-surface-800/30">
                  <td className="px-5 py-4 text-surface-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-brand-600 font-medium">{log.action}</td>
                  <td className="px-5 py-4 text-surface-400">{log.actorId}</td>
                  <td className="px-5 py-4 text-surface-400">{log.targetType}: {log.targetId}</td>
                  <td className="px-5 py-4 text-surface-400">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
