import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import _ from 'lodash';

// Component imports
import MonthProgress from './MonthProgress';
import MeetingGuide from './MeetingGuide';
import KPITable from './KPITable';

// Icon imports
import seIcon from '../assets/icons/se.png';
import nIcon from '../assets/icons/n.png';
import swIcon from '../assets/icons/sw.png';
import lvIcon from '../assets/icons/lv.png';
import irrIcon from '../assets/icons/irr.png';

const MEETING_TYPE = 'bm-meeting';

// Format a date value as 'YYYY-MM-DD' for Supabase queries
const formatDateForDB = (date) => new Date(date).toISOString().split('T')[0];

// Immutably update a single field on a KPI within the metrics array
const updateKpiField = (metrics, mIndex, kIndex, field, value) =>
  metrics.map((metric, i) =>
    i !== mIndex
      ? metric
      : {
          ...metric,
          kpis: metric.kpis.map((kpi, j) =>
            j !== kIndex ? kpi : { ...kpi, [field]: value }
          ),
        }
  );

const meetingData = {
  mission: "Uplifting & Enriching our people & the properties we maintain",
  currentBooks: ["Seven habits of highly effective people", "Raving fans"],
  metrics: [
    {
      category: 'Client',
      kpis: [
        {
          name: 'Hot Properties',
          explanation: 'Identify and address high-risk properties',
          target: '-',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Ownership Walks',
          explanation: 'Review upcoming walks and review actions from prior walks',
          target: '-',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Management Changes',
          explanation: 'Track and work through property management transitions',
          target: '-',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Cancellations',
          explanation: 'Monitor and follow processes for contract cancellations',
          target: '-',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'New Jobs',
          explanation: 'Track new job start-ups and prepare for service start',
          target: '-',
          actual: '',
          status: '',
          actions: ''
        }
      ]
    },
    {
      category: 'Financial',
      kpis: [
        {
          name: 'Maintenance Direct Labor Cost (DL%)',
          explanation: 'Monitor and optimize labor cost efficiency',
          target: '40%',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Maintenance Direct Labor Cost (DL%) - Onsites',
          explanation: 'Monitor and optimize labor cost efficiency',
          target: '55%',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Client Retention Rate',
          explanation: 'Retain current maintenance clients. Measured against Jan BOB',
          target: '90%',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'OT %',
          explanation: 'Overtime percentage',
          target: '1%',
          actual: '',
          status: '',
          actions: ''
        }
      ]
    },
    {
      category: 'Internal',
      kpis: [
        {
          name: 'Maintenance Visit Note Creation',
          explanation: 'Visit Notes/Punchlists created for every visit',
          target: '90%',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Maintenance Checklist Completion',
          explanation: 'Crews completing punchlist and checklist items in app',
          target: '80%',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Fleet Management',
          explanation: 'Review vehicle and equipment needs or issues',
          target: '-',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Safety Compliance',
          explanation: '',
          target: '-',
          actual: '',
          status: '',
          actions: ''
        }
      ]
    },
    {
      category: 'People, Learning & Growth',
      kpis: [
        {
          name: 'Hiring Needs',
          target: 'Fill critical positions',
          explanation: 'Identify any employee needs',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Training & Development',
          target: 'Upcoming Training',
          explanation: 'Complete required training of the month',
          actual: '',
          status: '',
          actions: ''
        },
        {
          name: 'Employee Engagement',
          target: '',
          explanation: 'Recognize and appreciate employee contributions, achievements, milestones, and/or behaviors that support organizational goals and values',
          actual: '',
          status: '',
          actions: ''
        }
      ]
    }
  ].sort((a, b) => a.category.localeCompare(b.category))
};

// Irrigation KPI template
const getIrrigationKPIs = () => [
  {
    category: 'Financial',
    kpis: [
      {
        name: 'Irrigation Revenue',
        explanation: 'Track irrigation service revenue across properties',
        target: '',
        actual: '',
        status: '',
        actions: ''
      },
      {
        name: 'Billable Time %',
        explanation: '% of Time on revenue generating activities',
        target: '85%',
        actual: '',
        status: '',
        actions: ''
      }
    ]
  },
  {
    category: 'Client',
    kpis: [
      {
        name: 'Open Opportunities',
        explanation: 'Track potential irrigation service opportunities',
        target: '',
        actual: '',
        status: '',
        actions: ''
      }
    ]
  },
  {
    category: 'Internal',
    kpis: [
      {
        name: 'Processes & Procedures',
        explanation: 'Evaluate and improve irrigation workflows',
        target: '',
        actual: '',
        status: '',
        actions: ''
      }
    ]
  },
  {
    category: 'People, Learning & Growth',
    kpis: [
      {
        name: 'Hiring Needs',
        explanation: 'Identify irrigation team staffing needs',
        target: 'Fill critical positions',
        actual: '',
        status: '',
        actions: ''
      },
      {
        name: 'Training & Development',
        explanation: 'Complete required training for irrigation team',
        target: '',
        actual: '',
        status: '',
        actions: ''
      },
      {
        name: 'Employee Engagement',
        explanation: 'Recognize and appreciate employee contributions',
        target: '',
        actual: '',
        status: '',
        actions: ''
      }
    ]
  }
];

const generateBiWeeklyTuesdays = () => {
  const dates = [];
  const startDate = new Date('2024-12-10');
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 14);
  }

  return dates;
};

const findNearestDate = (dates) => {
  const today = new Date();
  return dates.reduce((nearest, date) => {
    const current = new Date(date);
    const nearestDate = new Date(nearest);
    return Math.abs(current - today) < Math.abs(nearestDate - today) ? date : nearest;
  });
};

const branches = [
  { id: 'SE', name: 'SE Manager', icon: seIcon },
  { id: 'N', name: 'N Manager', icon: nIcon },
  { id: 'SW', name: 'SW Manager', icon: swIcon },
  { id: 'LV', name: 'LV Manager', icon: lvIcon },
  { id: 'IRR', name: 'Irrigation', icon: irrIcon }
];

const tabOptions = [
  { id: 'guide', name: 'Meeting Guide' },
  ...branches
];

const BranchManagerMeeting = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentBooks, setCurrentBooks] = useState([]);
  const [facilitator, setFacilitator] = useState('');
  const [selectedTab, setSelectedTab] = useState('guide');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [metricsData, setMetricsData] = useState([]);
  const [irrigationBranchId, setIrrigationBranchId] = useState('IRR-SE');

  const agaveLogo = new URL('../assets/logos/agave.png', import.meta.url).href;
  const pendingSavesRef = useRef(null);

  const dates = generateBiWeeklyTuesdays();
  const [selectedDate, setSelectedDate] = useState(findNearestDate(dates));

  // ── Data fetching ─────────────────────────────────────────────

  const fetchMeetingMetadata = async (date) => {
    try {
      const formattedDate = formatDateForDB(date);

      const { data, error } = await supabase
        .from('meeting_metadata')
        .select('*')
        .eq('meeting_type', MEETING_TYPE)
        .eq('meeting_date', formattedDate)
        .maybeSingle();

      if (error) {
        console.error('Error fetching metadata:', error);
        return;
      }

      if (data) {
        setCurrentBooks(data.current_books || []);
        setFacilitator(data.facilitator || '');
      } else {
        setCurrentBooks(meetingData.currentBooks);
        setFacilitator('');
      }
    } catch (err) {
      console.error('Error in fetchMeetingMetadata:', err);
      setCurrentBooks(meetingData.currentBooks);
      setFacilitator('');
    }
  };

  const saveMeetingMetadata = async (newBooks, newFacilitator) => {
    try {
      const formattedDate = formatDateForDB(selectedDate);

      const { error } = await supabase
        .from('meeting_metadata')
        .upsert({
          meeting_type: MEETING_TYPE,
          meeting_date: formattedDate,
          current_books: newBooks,
          facilitator: newFacilitator,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'meeting_type,meeting_date'
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving metadata:', err);
    }
  };

  const handleBookChange = (index, newValue) => {
    const newBooks = [...currentBooks];
    newBooks[index] = newValue;
    setCurrentBooks(newBooks);
    saveMeetingMetadata(newBooks, facilitator);
  };

  const handleFacilitatorChange = (newValue) => {
    setFacilitator(newValue);
    saveMeetingMetadata(currentBooks, newValue);
  };

  const handleAddBook = async () => {
    try {
      const newBooks = [...currentBooks, ''];

      const { error } = await supabase
        .from('meeting_metadata')
        .upsert({
          meeting_type: MEETING_TYPE,
          meeting_date: formatDateForDB(selectedDate),
          current_books: newBooks,
          facilitator: facilitator,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setCurrentBooks(newBooks);
    } catch (err) {
      console.error('Error adding book:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    try {
      for (const file of files) {
        const filePath = `${selectedDate}/${file.name}`;

        const { error } = await supabase.storage
          .from('meeting-files')
          .upload(filePath, file);

        if (error) {
          console.error('Error uploading file:', error);
          return;
        }
      }
      await fetchFilesForDate(selectedDate);
    } catch (error) {
      console.error('Error in file upload:', error);
    }
  };

  const fetchFilesForDate = async (date) => {
    try {
      const { data, error } = await supabase.storage
        .from('meeting-files')
        .list(date);

      if (error) {
        console.error('Error fetching files:', error);
        return;
      }

      setUploadedFiles(data ? data.map(file => ({
        name: file.name,
        path: `${date}/${file.name}`
      })) : []);
    } catch (error) {
      console.error('Error in fetchFilesForDate:', error);
    }
  };

  // ── KPI data ──────────────────────────────────────────────────

  const fetchKPIData = async (branchId, date) => {
    try {
      setLoading(true);
      const formattedDate = formatDateForDB(date);

      const { data, error } = await supabase
        .from('kpi_entries')
        .select('*')
        .eq('meeting_type', MEETING_TYPE)
        .eq('branch_id', branchId)
        .eq('meeting_date', formattedDate);

      if (error) throw error;

      if (data.length === 0) {
        const initialEntries = meetingData.metrics.flatMap(metric =>
          metric.kpis.map(kpi => ({
            meeting_type: MEETING_TYPE,
            branch_id: branchId,
            meeting_date: formattedDate,
            category: metric.category,
            kpi_name: kpi.name,
            target: kpi.target,
            actual: '',
            status: 'in-progress',
            actions: ''
          }))
        );

        const { data: newData, error: insertError } = await supabase
          .from('kpi_entries')
          .insert(initialEntries)
          .select();

        if (insertError) throw insertError;

        return transformKPIData(newData);
      }

      return transformKPIData(data);
    } catch (err) {
      setError(err.message);
      return meetingData.metrics;
    } finally {
      setLoading(false);
    }
  };

  const transformKPIData = (data) => {
    const groupedData = data.reduce((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = { category: entry.category, kpis: [] };
      }

      const originalKPI = meetingData.metrics
        .find(m => m.category === entry.category)
        ?.kpis.find(k => k.name === entry.kpi_name);

      acc[entry.category].kpis.push({
        name: entry.kpi_name,
        target: entry.target,
        actual: entry.actual,
        status: entry.status,
        actions: entry.actions,
        explanation: originalKPI?.explanation || ''
      });
      return acc;
    }, {});

    Object.values(groupedData).forEach(group => {
      group.kpis.sort((a, b) => a.name.localeCompare(b.name));
    });

    return Object.values(groupedData).sort((a, b) =>
      a.category.localeCompare(b.category)
    );
  };

  const addNewFinancialKPI = async (branchId, date) => {
    try {
      const { data, error } = await supabase
        .from('kpi_entries')
        .select('*')
        .eq('meeting_type', MEETING_TYPE)
        .eq('branch_id', branchId)
        .eq('meeting_date', formatDateForDB(date))
        .eq('category', 'Financial')
        .eq('kpi_name', 'Maintenance Direct Labor Cost (DL%) - Onsites');

      if (error) throw error;

      if (data.length === 0) {
        const { error: insertError } = await supabase
          .from('kpi_entries')
          .insert({
            meeting_type: MEETING_TYPE,
            branch_id: branchId,
            meeting_date: formatDateForDB(date),
            category: 'Financial',
            kpi_name: 'Maintenance Direct Labor Cost (DL%) - Onsites',
            target: '55%',
            actual: '',
            status: 'in-progress',
            actions: ''
          });

        if (insertError) throw insertError;
      }
    } catch (err) {
      console.error('Error adding new Financial KPI:', err);
    }
  };

  // ── Irrigation data ───────────────────────────────────────────

  const fetchIrrigationData = async (branchId) => {
    try {
      setLoading(true);
      const formattedDate = formatDateForDB(selectedDate);

      if (pendingSavesRef.current) {
        pendingSavesRef.current.cancel();
        pendingSavesRef.current.flush();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const irrigationTemplate = getIrrigationKPIs();

      const { data, error } = await supabase
        .from('kpi_entries')
        .select('*')
        .eq('meeting_type', MEETING_TYPE)
        .eq('branch_id', branchId)
        .eq('meeting_date', formattedDate);

      if (error) throw error;

      if (data && data.length > 0) {
        const transformedData = irrigationTemplate.map(templateCategory => ({
          category: templateCategory.category,
          kpis: templateCategory.kpis.map(templateKpi => {
            const savedKpi = data.find(
              d => d.category === templateCategory.category &&
                   d.kpi_name === templateKpi.name
            );

            return {
              name: templateKpi.name,
              explanation: templateKpi.explanation,
              target: savedKpi?.target || templateKpi.target || '',
              actual: savedKpi?.actual || '',
              status: savedKpi?.status || '',
              actions: savedKpi?.actions || ''
            };
          })
        }));

        setMetricsData(transformedData);
      } else {
        const initialEntries = irrigationTemplate.flatMap(metric =>
          metric.kpis.map(kpi => ({
            meeting_type: MEETING_TYPE,
            branch_id: branchId,
            meeting_date: formattedDate,
            category: metric.category,
            kpi_name: kpi.name,
            target: kpi.target || '',
            actual: '',
            status: '',
            actions: '',
            updated_at: new Date().toISOString()
          }))
        );

        const { error: insertError } = await supabase
          .from('kpi_entries')
          .insert(initialEntries)
          .select();

        if (insertError) console.error('Insert error:', insertError);
        setMetricsData(irrigationTemplate);
      }
    } catch (err) {
      console.error('Error in fetchIrrigationData:', err);
      setMetricsData(getIrrigationKPIs());
    } finally {
      setLoading(false);
    }
  };

  // ── Change handlers ───────────────────────────────────────────

  const handleActualChange = async (mIndex, kIndex, newValue) => {
    const metric = metricsData[mIndex];
    const kpi = metric.kpis[kIndex];

    setMetricsData(prev => updateKpiField(prev, mIndex, kIndex, 'actual', newValue));

    try {
      if (selectedTab === 'IRR') {
        const { error } = await supabase
          .from('kpi_entries')
          .upsert({
            meeting_type: MEETING_TYPE,
            branch_id: irrigationBranchId,
            meeting_date: formatDateForDB(selectedDate),
            category: metric.category,
            kpi_name: kpi.name,
            actual: newValue,
            status: kpi.status || 'in-progress',
            actions: kpi.actions || '',
            target: kpi.target || '',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'meeting_type,branch_id,meeting_date,category,kpi_name'
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kpi_entries')
          .update({
            actual: newValue,
            updated_at: new Date().toISOString()
          })
          .eq('meeting_type', MEETING_TYPE)
          .eq('branch_id', selectedTab)
          .eq('meeting_date', formatDateForDB(selectedDate))
          .eq('category', metric.category)
          .eq('kpi_name', kpi.name);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error updating actual:', err);
      setError(err.message);
    }
  };

  const handleStatusChange = async (mIndex, kIndex, newValue) => {
    const metric = metricsData[mIndex];
    const kpi = metric.kpis[kIndex];

    setMetricsData(prev => updateKpiField(prev, mIndex, kIndex, 'status', newValue));

    try {
      if (selectedTab === 'IRR') {
        const { error } = await supabase
          .from('kpi_entries')
          .upsert({
            meeting_type: MEETING_TYPE,
            branch_id: irrigationBranchId,
            meeting_date: formatDateForDB(selectedDate),
            category: metric.category,
            kpi_name: kpi.name,
            actual: kpi.actual || '',
            status: newValue,
            actions: kpi.actions || '',
            target: kpi.target || '',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'meeting_type,branch_id,meeting_date,category,kpi_name'
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('kpi_entries')
          .update({
            status: newValue,
            updated_at: new Date().toISOString()
          })
          .eq('meeting_type', MEETING_TYPE)
          .eq('branch_id', selectedTab)
          .eq('meeting_date', formatDateForDB(selectedDate))
          .eq('category', metric.category)
          .eq('kpi_name', kpi.name);

        if (error) throw error;
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const debouncedSaveActions = useMemo(
    () => _.debounce(async (newValue, branchId, date, category, kpiName, currentKpi) => {
      try {
        const { error } = await supabase
          .from('kpi_entries')
          .upsert({
            meeting_type: MEETING_TYPE,
            branch_id: branchId,
            meeting_date: date,
            category: category,
            kpi_name: kpiName,
            target: currentKpi.target || '',
            actual: currentKpi.actual || '',
            status: currentKpi.status || 'in-progress',
            actions: newValue,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'meeting_type,branch_id,meeting_date,category,kpi_name'
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error saving action:', err);
      }
    }, 500),
    []
  );

  const handleActionsChange = (mIndex, kIndex, newValue) => {
    const metric = metricsData[mIndex];
    const kpi = metric.kpis[kIndex];
    const formattedDate = formatDateForDB(selectedDate);
    const branchId = selectedTab === 'IRR' ? irrigationBranchId : selectedTab;

    setMetricsData(prev => updateKpiField(prev, mIndex, kIndex, 'actions', newValue));

    if (pendingSavesRef.current) {
      pendingSavesRef.current.cancel();
    }

    debouncedSaveActions(newValue, branchId, formattedDate, metric.category, kpi.name, kpi);
  };

  // ── Effects ───────────────────────────────────────────────────

  useEffect(() => {
    const loadData = async () => {
      if (pendingSavesRef.current) {
        pendingSavesRef.current.flush();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (selectedTab !== 'guide') {
        if (selectedTab === 'IRR') {
          await fetchIrrigationData(irrigationBranchId);
        } else {
          const data = await fetchKPIData(selectedTab, selectedDate);
          setMetricsData(data);
          await addNewFinancialKPI(selectedTab, selectedDate);
        }
      }
    };

    loadData();
  }, [selectedTab, selectedDate, irrigationBranchId]);

  useEffect(() => {
    if (pendingSavesRef.current) {
      pendingSavesRef.current.cancel();
      pendingSavesRef.current.flush();
    }
  }, [selectedTab]);

  useEffect(() => {
    fetchFilesForDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const handleTabClose = () => {
      supabase.auth.signOut();
    };

    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, []);

  useEffect(() => {
    fetchMeetingMetadata(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (pendingSavesRef.current) {
        pendingSavesRef.current.flush();
      }
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="bg-blue-50 min-h-screen w-full">
      <div className="container mx-auto p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img
              src={agaveLogo}
              alt="Agave Logo"
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-semibold">Branch Meeting Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <MonthProgress />
            <div className="relative min-w-[200px]">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-2.5 px-4 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
              >
                {dates.map(date => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" fillRule="evenodd" d="M10 12l-5-5h10l-5 5z" />
                </svg>
              </div>
            </div>
            <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <User className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="ml-2 p-1 hover:bg-gray-100 rounded-full"
                title="Sign out"
              >
                <LogOut className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 gap-1">
            {tabOptions.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={`
                  rounded-xl px-4 py-3 text-sm font-medium transition-all shadow-sm
                  flex items-center gap-2 justify-center
                  ${tab.id === 'SE' && 'bg-red-200 hover:bg-red-300'}
                  ${tab.id === 'SE' && '[&[data-state=active]]:bg-red-400 [&[data-state=active]]:text-white'}
                  ${tab.id === 'N' && 'bg-green-200 hover:bg-green-300'}
                  ${tab.id === 'N' && '[&[data-state=active]]:bg-green-400 [&[data-state=active]]:text-white'}
                  ${tab.id === 'SW' && 'bg-blue-200 hover:bg-blue-300'}
                  ${tab.id === 'SW' && '[&[data-state=active]]:bg-blue-400 [&[data-state=active]]:text-white'}
                  ${tab.id === 'LV' && 'bg-yellow-200 hover:bg-yellow-300'}
                  ${tab.id === 'LV' && '[&[data-state=active]]:bg-yellow-400 [&[data-state=active]]:text-white'}
                  ${tab.id === 'IRR' && 'bg-teal-200 hover:bg-teal-300'}
                  ${tab.id === 'IRR' && '[&[data-state=active]]:bg-teal-400 [&[data-state=active]]:text-white'}
                  ${tab.id === 'guide' && 'bg-blue-200 hover:bg-blue-300'}
                  ${tab.id === 'guide' && '[&[data-state=active]]:bg-blue-600 [&[data-state=active]]:text-white'}
                `}
              >
                {tab.id !== 'guide' && (
                  <img src={tab.icon} alt={tab.name} className="w-6 h-6" />
                )}
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Meeting Guide Tab */}
          <TabsContent value="guide">
            <MeetingGuide
              meetingData={meetingData}
              currentBooks={currentBooks}
              setCurrentBooks={setCurrentBooks}
              handleBookChange={handleBookChange}
              handleAddBook={handleAddBook}
              facilitator={facilitator}
              setFacilitator={setFacilitator}
              handleFacilitatorChange={handleFacilitatorChange}
              uploadedFiles={uploadedFiles}
              handleFileUpload={handleFileUpload}
              selectedDate={selectedDate}
            />
          </TabsContent>

          {/* Branch Tabs */}
          {branches.map(branch => {
            if (branch.id === 'IRR') {
              return (
                <TabsContent key={branch.id} value={branch.id} className="space-y-4 mt-6">
                  {/* Irrigation branch selector */}
                  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white p-4 mb-4">
                    <h3 className="text-sm font-medium mb-3">Select Branch:</h3>
                    <div className="flex space-x-2">
                      {branches.filter(b => b.id !== 'IRR').map(subBranch => (
                        <button
                          key={subBranch.id}
                          onClick={() => {
                            const newIrrigationBranchId = `IRR-${subBranch.id}`;
                            setIrrigationBranchId(newIrrigationBranchId);
                            fetchIrrigationData(newIrrigationBranchId);
                          }}
                          className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg border transition-all
                            ${irrigationBranchId === `IRR-${subBranch.id}` ? 'bg-teal-100 border-teal-400' : 'border-gray-200'}
                            ${subBranch.id === 'SE' ? 'hover:bg-red-100' : ''}
                            ${subBranch.id === 'N' ? 'hover:bg-green-100' : ''}
                            ${subBranch.id === 'SW' ? 'hover:bg-blue-100' : ''}
                            ${subBranch.id === 'LV' ? 'hover:bg-yellow-100' : ''}
                          `}
                        >
                          <img src={subBranch.icon} alt={subBranch.name} className="w-6 h-6" />
                          <span>{subBranch.name.replace(' Manager', '')}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <KPITable
                    loading={loading}
                    metricsData={metricsData}
                    handleActualChange={handleActualChange}
                    handleStatusChange={handleStatusChange}
                    handleActionsChange={handleActionsChange}
                    headerTitle="Irrigation KPIs"
                    isIrrigation={true}
                  />
                </TabsContent>
              );
            }

            return (
              <TabsContent key={branch.id} value={branch.id} className="space-y-4 mt-6">
                <KPITable
                  loading={loading}
                  metricsData={metricsData}
                  handleActualChange={handleActualChange}
                  handleStatusChange={handleStatusChange}
                  handleActionsChange={handleActionsChange}
                  branchId={branch.id}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default BranchManagerMeeting;
