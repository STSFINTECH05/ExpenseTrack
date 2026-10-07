import React from 'react';
import {
  Layers,
  Users2,
  CreditCard,
  Building2,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Server,
  Zap,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, backendHealth }) {
  const navItems = [
    {
      id: 'segregation',
      label: 'Segregation',
      icon: Layers,
      badge: 'Active',
      description: 'Income, Expenses & Ledger',
    },
    {
      id: 'split_collect',
      label: 'Split & Collect',
      icon: Users2,
      badge: 'Soon',
      description: 'Shared Expenses & Escrow',
    },
    {
      id: 'payments',
      label: 'Direct Payments',
      icon: CreditCard,
      badge: 'Live',
      description: 'Outflow & Vendor API',
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0d1322] border-r border-slate-800/80 flex flex-col min-h-full">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-[2px] shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <div className="h-full w-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white">CLIKS</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                STS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">STS FINTECH PVT LTD</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-3.5 space-y-1.5 flex-1">
        <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Core Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-white border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`p-2 rounded-lg transition ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isActive
                      ? 'bg-emerald-400 text-slate-950'
                      : item.badge === 'Soon'
                      ? 'bg-slate-800 text-slate-400 border border-slate-700'
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Backend Health Status in Sidebar Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#090d16]/50">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>Core Server</span>
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealth?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>
          <p className="text-[10px] text-slate-500 truncate">
            {backendHealth?.status === 'healthy'
              ? 'API Gateway Operational'
              : 'Server offline / connecting'}
          </p>
        </div>
      </div>
    </aside>
  );
}
