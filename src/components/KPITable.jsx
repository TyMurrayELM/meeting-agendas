import React, { useMemo } from 'react';
import { Info, CheckCircle2, Check, Clock, RefreshCw, BookOpen, AlertTriangle, AlertOctagon, ExternalLink } from 'lucide-react';
import RichTextActions from './RichTextActions';

// Reusable info tooltip
const InfoTooltip = ({ text }) => (
  <div className="relative group">
    <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500 cursor-help transition-colors" aria-label="Help" />
    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-20 leading-relaxed">
      {text}
      <div className="absolute left-3 top-full w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-gray-900"></div>
    </div>
  </div>
);

const STATUS_CONFIG = {
  'all-good':      { icon: CheckCircle2, label: 'All Good',      color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-300' },
  'on-track':      { icon: Check,        label: 'On Track',      color: 'text-green-500',  bg: 'bg-green-50',  border: 'border-green-300' },
  'resolving':     { icon: Clock,        label: 'Resolving',     color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300' },
  'in-progress':   { icon: RefreshCw,    label: 'In Progress',   color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-300' },
  'in-training':   { icon: BookOpen,     label: 'In Training',   color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-300' },
  'off-track':     { icon: AlertTriangle,label: 'Off Track',     color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-300' },
  'serious-issue': { icon: AlertOctagon, label: 'Serious Issue', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-400' },
};

const CATEGORY_CONFIG = {
  'Operations': {
    bg: 'bg-orange-50/60',
    border: 'border-l-orange-500',
    badge: 'bg-orange-100 text-orange-700',
    objective: '',
  },
  'Financial': {
    bg: 'bg-emerald-50/60',
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    objective: 'Meeting or exceeding budget and revenue targets',
  },
  'Client': {
    bg: 'bg-blue-50/60',
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    objective: 'Providing excellent service and developing trust with our clients',
  },
  'Internal': {
    bg: 'bg-violet-50/60',
    border: 'border-l-violet-500',
    badge: 'bg-violet-100 text-violet-700',
    objective: 'Optimizing workflow to increase efficiency',
  },
  'People, Learning & Growth': {
    bg: 'bg-amber-50/60',
    border: 'border-l-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    objective: 'Develop skilled landscape maintenance technicians',
  },
};

// Category objectives specific to irrigation
const IRRIGATION_OBJECTIVES = {
  'Financial': 'Meeting Revenue per Tech Targets',
  'Client': 'Lingering Irrigation Jobs or Renovation Opportunities',
  'Internal': 'Utilizing Irrigation Process and Supporting other Departments',
  'People, Learning & Growth': 'Develop skilled irrigation technicians',
};

const KPI_TOOLTIPS = {
  'Maintenance Direct Labor Cost (DL%)': 'Monitor and optimize labor cost efficiency across all maintenance operations',
  'Maintenance Direct Labor Cost (DL%) - Onsites': 'Monitor and optimize labor cost efficiency for onsite maintenance',
  'Hiring Needs': 'Identify any employee needs to meet service targets',
};

// Static links (same URL regardless of branch)
const KPI_LINKS = {};

// Branch-specific links (different URL per branch tab)
const BRANCH_PARAM = {
  'SE': 'Phx+-+SouthEast',
  'N': 'Phx+-+North',
  'SW': 'Phx+-+SouthWest',
  'LV': 'Las+Vegas',
};

const KPI_BRANCH_LINKS = {
  'Cancellations': (branchId) =>
    `https://manage.encorelm.com/crm/properties?search=&branch_name=${BRANCH_PARAM[branchId]}&maintenance_contract=all&terminated=true`,
  'Hot Properties': (branchId) =>
    `https://manage.encorelm.com/crm/properties?search=&branch_name=${BRANCH_PARAM[branchId]}&maintenance_contract=true&stoplight_status=red`,
  'New Jobs': (branchId) =>
    `https://manage.encorelm.com/crm/properties?search=&branch_name=${BRANCH_PARAM[branchId]}&maintenance_contract=true&new_property=true`,
  'Ownership Walks': (branchId) =>
    `https://manage.encorelm.com/crm/ownership_walks?branch_name=${BRANCH_PARAM[branchId]}&sentiment=all`,
  'Maintenance Punchlist Completion': (branchId) =>
    `https://manage.encorelm.com/punchlist_reviews?view_type=monthly&branch_name=${BRANCH_PARAM[branchId]}`,
  'Maintenance Visit Punchlist Creation': (branchId) =>
    `https://manage.encorelm.com/punchlist_reviews?view_type=monthly&branch_name=${BRANCH_PARAM[branchId]}`,
  'Fleet Management': (branchId) =>
    `https://manage.encorelm.com/service_requests?status%5B%5D=&status%5B%5D=acknowledged&status%5B%5D=in_progress&status%5B%5D=submitted&status%5B%5D=waiting_parts&priority=&issue_category=inspection&branch=${BRANCH_PARAM[branchId]}&assigned_to_id=`,
  'Urgent Property Service Requests': () =>
    'https://manage.encorelm.com/property_service_requests?branch=&status%5B%5D=submitted&status%5B%5D=acknowledged&status%5B%5D=scheduled&status%5B%5D=in_progress&status%5B%5D=on_hold&priority=urgent&client_specialist_id=&property_id=&route_id=',
  'Open Property Service Requests': (branchId) =>
    `https://manage.encorelm.com/property_service_requests?branch=${BRANCH_PARAM[branchId]}&status%5B%5D=submitted&status%5B%5D=acknowledged&status%5B%5D=scheduled&status%5B%5D=in_progress&status%5B%5D=on_hold&priority=&client_specialist_id=&property_id=&route_id=`,
};

// KPIs that show a Slack icon instead of an external link
const SLACK_KPIS = new Set([
  'Maintenance Direct Labor Cost (DL%)',
  'Maintenance Direct Labor Cost (DL%) - Onsites',
  'Client Retention Rate',
  'OT %',
]);

// Slack logo SVG component
const SlackIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 0 1 2.52-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.52V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.312zm-2.521 10.124a2.528 2.528 0 0 1 2.521 2.52A2.528 2.528 0 0 1 15.166 24a2.528 2.528 0 0 1-2.521-2.522v-2.52h2.52zm0-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.166a2.528 2.528 0 0 1-2.522 2.521h-6.312z"/>
  </svg>
);

// KPIs that should not show a status dropdown
const KPIS_WITHOUT_STATUS = new Set([]);

// Compute delta between target and actual
const computeDelta = (target, actual) => {
  if (!target || !actual) return null;

  const parse = (val) => {
    const cleaned = String(val).replace(/[$,%\s,]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const t = parse(target);
  const a = parse(actual);
  if (t === null || a === null) return null;

  const diff = a - t;
  const isPercent = String(target).includes('%') || String(actual).includes('%');

  let formatted;
  if (isPercent) {
    formatted = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
  } else {
    formatted = `${diff >= 0 ? '+' : ''}${diff % 1 === 0 ? diff : diff.toFixed(1)}`;
  }

  return { value: diff, formatted };
};

const KPITable = ({
  loading,
  metricsData,
  handleActualChange,
  handleStatusChange,
  handleActionsChange,
  headerTitle = 'Strategic Objectives & KPIs',
  isIrrigation = false,
  branchId = null,
}) => {
  return (
    <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200/80 bg-white">
      {/* Header */}
      <div className={`px-6 py-4 ${isIrrigation
        ? 'bg-gradient-to-r from-teal-700 to-teal-600'
        : 'bg-gradient-to-r from-blue-900 to-blue-800'
      }`}>
        <h2 className="text-lg font-semibold text-white tracking-tight">{headerTitle}</h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider w-44">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider w-52">KPI</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider w-36">Target</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider w-36">Actual</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-black uppercase tracking-wider w-24">Delta</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider w-44">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Actions & Deadlines</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-sm text-black">Loading data...</span>
                  </div>
                </td>
              </tr>
            ) : metricsData.map((metric, mIndex) => {
              const config = CATEGORY_CONFIG[metric.category] || {
                bg: 'bg-white',
                border: 'border-l-gray-300',
                badge: 'bg-gray-100 text-black',
                objective: '',
              };

              const objective = isIrrigation
                ? (IRRIGATION_OBJECTIVES[metric.category] || config.objective)
                : config.objective;

              return metric.kpis.map((kpi, kIndex) => {
                const statusCfg = STATUS_CONFIG[kpi.status];
                const StatusIcon = statusCfg?.icon;
                const delta = computeDelta(kpi.target, kpi.actual);
                const showStatus = !KPIS_WITHOUT_STATUS.has(kpi.name);
                const branchLinkFn = KPI_BRANCH_LINKS[kpi.name];
                const kpiLink = (branchLinkFn && branchId ? branchLinkFn(branchId) : null) || KPI_LINKS[kpi.name] || null;
                const isSlackKpi = SLACK_KPIS.has(kpi.name);
                const hasIcon = kpiLink || isSlackKpi;

                return (
                  <tr
                    key={`${mIndex}-${kIndex}`}
                    className={`${config.bg} border-l-4 ${config.border} hover:bg-white/80 transition-colors`}
                  >
                    {/* Category */}
                    <td className="px-5 py-3.5 align-top">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${config.badge}`}>
                        {metric.category}
                      </span>
                      {objective && (
                        <p className="text-[11px] text-black mt-1.5 leading-snug pr-2">
                          {objective}
                        </p>
                      )}
                    </td>

                    {/* KPI Name */}
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-black">{kpi.name}</span>
                        {KPI_TOOLTIPS[kpi.name] && (
                          <InfoTooltip text={KPI_TOOLTIPS[kpi.name]} />
                        )}
                      </div>
                      {kpi.explanation && (
                        <p className="text-[11px] text-black mt-1 leading-snug pr-2">
                          {kpi.explanation}
                        </p>
                      )}
                    </td>

                    {/* Target */}
                    <td className="px-5 py-3.5 align-top">
                      <span className="text-sm font-medium text-black">{kpi.target || '-'}</span>
                    </td>

                    {/* Actual */}
                    <td className="px-5 py-3.5 align-top">
                      <div className={hasIcon ? 'flex items-start gap-1.5' : ''}>
                        <input
                          type="text"
                          value={kpi.actual || ''}
                          onChange={(e) => handleActualChange(mIndex, kIndex, e.target.value)}
                          placeholder="..."
                          className="w-full px-2 py-1.5 bg-white border border-black rounded-lg text-sm text-center
                            hover:border-black focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                        />
                        {kpiLink && (
                          <a
                            href={kpiLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0"
                            title="Open data source"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        {isSlackKpi && !kpiLink && (
                          <div className="mt-2 text-[#4A154B] flex-shrink-0" title="Can be found in Slack">
                            <SlackIcon className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Delta */}
                    <td className="px-5 py-3.5 align-top text-center">
                      {delta ? (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          delta.value > 0 ? 'bg-green-100 text-green-700' :
                          delta.value < 0 ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-black'
                        }`}>
                          {delta.formatted}
                        </span>
                      ) : (
                        <span className="text-xs text-black">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 align-top">
                      {showStatus ? (
                        <div className="space-y-1.5">
                          <select
                            value={kpi.status}
                            onChange={(e) => handleStatusChange(mIndex, kIndex, e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded-lg bg-white text-sm appearance-none cursor-pointer
                              hover:border-black focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all
                              ${statusCfg ? `${statusCfg.border} ${statusCfg.bg}` : 'border-black'}
                              ${kpi.status === 'serious-issue' ? 'animate-pulse' : ''}`}
                          >
                            <option value="">Select status...</option>
                            {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                              <option key={value} value={value}>{cfg.label}</option>
                            ))}
                          </select>
                          {statusCfg && (
                            <div className={`flex items-center gap-1.5 px-1 ${statusCfg.color}`}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">{statusCfg.label}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-center">-</div>
                      )}
                    </td>

                    {/* Actions & Deadlines */}
                    <td className="px-5 py-3.5">
                      <RichTextActions
                        value={kpi.actions || ''}
                        onChange={(e) => handleActionsChange(mIndex, kIndex, e.target.value)}
                        placeholder="Enter actions & deadlines..."
                      />
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KPITable;
