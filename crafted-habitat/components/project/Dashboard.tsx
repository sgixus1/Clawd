
import React, { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Briefcase, DollarSign, Clock, AlertCircle, Activity, ChevronRight, TrendingUp, Layers, Database, HardHat } from 'lucide-react';
import { getStorageUsage } from '../../utils';

interface DashboardProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, onSelectProject }) => {
  const [storage, setStorage] = useState({ usedMb: '0', percentage: '0' });

  useEffect(() => {
    setStorage(getStorageUsage());
  }, [projects]);

  const safeProjects = Array.isArray(projects) ? projects.filter(p => p && typeof p === 'object') : [];
  
  const activeProjects = safeProjects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length;
  const totalBudget = safeProjects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  
  const totalSpent = safeProjects.reduce((acc, p) => {
    const mat = (p.materials || []).reduce((mAcc, m) => mAcc + ((Number(m.quantityUsed) || 0) * (Number(m.costPerUnit) || 0)), 0);
    const lab = (p.laborLogs || []).reduce((lAcc, l) => lAcc + ((Number(l.hours) || 0) * (Number(l.hourlyRate) || 0)), 0);
    const sub = (p.subcontractors || []).reduce((sAcc, s) => sAcc + (Number(s.paidAmount) || 0), 0);
    return acc + mat + lab + sub + (Number(p.spent) || 0);
  }, 0);

  const allUpdates = safeProjects.flatMap(p => 
    (p.dailyUpdates || []).map(u => ({ ...u, projectName: p.name, projectId: p.id }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 5);

  const progressData = safeProjects.map(p => ({
    name: p.name && p.name.length > 15 ? p.name.substring(0, 15) + '...' : (p.name || 'Unnamed'),
    progress: Number(p.progress) || 0,
    id: p.id
  }));

  const statusData = [
    { name: 'Active', value: safeProjects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length, color: '#059669' },
    { name: 'Planning', value: safeProjects.filter(p => p.status === ProjectStatus.PLANNING).length, color: '#fbbf24' },
    { name: 'Completed', value: safeProjects.filter(p => p.status === ProjectStatus.COMPLETED).length, color: '#94a3b8' },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, colorClass }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-emerald-900/5 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl transition-colors ${colorClass || 'bg-slate-50 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
           <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
             {/* Fix: Removed non-existent trend prop from TrendingUp icon */}
             <TrendingUp className="w-3 h-3 mr-1" /> {trend}
           </span>
        )}
      </div>
      <div>
         <h4 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</h4>
         <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Sites" 
          value={activeProjects} 
          icon={HardHat}
          colorClass="bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" 
        />
        <StatCard 
          title="Total Budget" 
          value={`$${(totalBudget / 1000).toFixed(1)}k`} 
          icon={DollarSign} 
          colorClass="bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
        />
        
        {/* STORAGE USAGE CARD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className={`p-3 rounded-2xl ${Number(storage.percentage) > 85 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Database size={24} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${Number(storage.percentage) > 85 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                    {Number(storage.percentage) > 85 ? 'Quota Alert' : 'Storage Load'}
                </span>
            </div>
            <div className="relative z-10">
                <p className="text-2xl font-black text-slate-800">{storage.percentage}%</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-1000 ${Number(storage.percentage) > 85 ? 'bg-rose-500' : 'bg-blue-500'}`} 
                        style={{width: `${storage.percentage}%`}}
                    ></div>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Used: {storage.usedMb}MB / 5.0MB</p>
            </div>
        </div>

        <StatCard 
          title="Utilized" 
          value={`${totalBudget > 0 ? Math.round((totalSpent/totalBudget)*100) : 0}%`}
          icon={Activity} 
          colorClass="bg-amber-50 text-amber-600 group-hover:bg-amber-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
               <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Project Progress</h2>
                  <p className="text-sm text-slate-400 mt-1">Real-time completion tracking</p>
               </div>
               <button className="text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">View Report</button>
            </div>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150} 
                    tick={{fontSize: 13, fill: '#64748b', fontWeight: 600}} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  />
                  <Bar dataKey="progress" fill="#059669" radius={[0, 8, 8, 0]} barSize={28}>
                     {progressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.progress === 100 ? '#10b981' : '#059669'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Projects</h2>
              <button className="p-2 text-slate-400 hover:text-emerald-600"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-8 py-4">Project Details</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Progress</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {safeProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer" onClick={() => onSelectProject(project.id)}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                              <Briefcase className="w-5 h-5" />
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{project.name || 'Unnamed'}</p>
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">{project.client || 'No Client'}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-sm
                          ${project.status === ProjectStatus.IN_PROGRESS ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                          ${project.status === ProjectStatus.PLANNING ? 'bg-amber-50 text-amber-700 border-amber-100' : ''}
                          ${project.status === ProjectStatus.COMPLETED ? 'bg-slate-100 text-slate-600 border-slate-200' : ''}
                        `}>
                          {project.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-semibold">
                         {project.endDate ? new Date(project.endDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-5 w-48">
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-slate-700 w-8 text-right">{project.progress}%</span>
                           <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                             <div className="bg-emerald-500 h-2.5 rounded-full shadow-sm" style={{ width: `${Number(project.progress) || 0}%` }}></div>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="p-2 rounded-full hover:bg-white text-slate-300 group-hover:text-emerald-600 transition-all inline-block shadow-sm opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center">
            <h2 className="text-lg font-bold text-slate-800 mb-2 self-start">Project Mix</h2>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                    cornerRadius={8}
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-4xl font-extrabold text-slate-800">{safeProjects.length}</span>
                 <span className="text-xs text-slate-400 uppercase tracking-wide font-bold mt-1">Total</span>
              </div>
            </div>
            <div className="w-full space-y-3 mt-4">
              {statusData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center text-slate-600 font-bold">
                    <span className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{backgroundColor: d.color}}></span>
                    {d.name}
                  </div>
                  <span className="font-bold text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-bold text-slate-800">Recent Updates</h2>
               <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><Activity className="w-4 h-4" /></div>
            </div>
            <div className="space-y-6">
              {allUpdates.length > 0 ? (
                allUpdates.map((update, idx) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-slate-100 pb-1 hover:border-emerald-400 transition-colors group">
                    <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-emerald-500 group-hover:scale-125 transition-transform"></div>
                    <div className="mb-1 flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{update.projectName}</span>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{update.date ? new Date(update.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'N/A'}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-2">{update.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">No recent updates logged.</p>
              )}
            </div>
            <button className="w-full mt-6 py-3 text-sm font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">View All Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
};
