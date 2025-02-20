import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Check, AlertTriangle, Timer, LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import _ from 'lodash';
// Keep your existing icon imports
import seIcon from '../assets/icons/se.png';
import nIcon from '../assets/icons/n.png';
import swIcon from '../assets/icons/sw.png';
import lvIcon from '../assets/icons/lv.png';


// Add this constant at the top of your component
const MEETING_TYPE = 'bm-meeting';

const BranchManagerMeeting = () => {
  const renderStatusOption = (status) => {
    switch (status) {
      case 'on-track':
        return <div className="flex items-center gap-2"><Check className="text-green-500" /> On Track</div>;
      case 'resolving':
        return <div className="flex items-center gap-2"><Timer className="text-yellow-500" /> Resolving</div>;
      case 'in-progress':
        return <div className="flex items-center gap-2"><Timer className="text-blue-500" /> In Progress</div>;
      case 'in-training':
        return <div className="flex items-center gap-2"><Timer className="text-purple-500" /> In Training</div>;
      case 'off-track':
        return <div className="flex items-center gap-2"><AlertTriangle className="text-red-500" /> Off Track</div>;
      case '':
        return <div className="text-gray-400">Status needed</div>;
      default:
        return status;
    }
  };

  const [uploadedFiles, setUploadedFiles] = useState([]);
  // Add these new states near your other state declarations
const [currentBooks, setCurrentBooks] = useState([]);
const [facilitator, setFacilitator] = useState('');
const agaveLogo = new URL('../assets/logos/agave.png', import.meta.url).href

// Add these new handlers near your other handlers
const fetchMeetingMetadata = async (date) => {
  try {
    console.log('Fetching metadata for date:', date);
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('meeting_metadata')
      .select('*')
      .eq('meeting_type', MEETING_TYPE)
      .eq('meeting_date', formattedDate)
      .maybeSingle(); // Use maybeSingle instead of single to handle null case better

    console.log('Fetched metadata:', { data, error });

    if (error) {
      console.error('Error fetching metadata:', error);
      return;
    }

    if (data) {
      console.log('Setting state with:', {
        books: data.current_books,
        facilitator: data.facilitator
      });
      setCurrentBooks(data.current_books || []);
      setFacilitator(data.facilitator || '');
    } else {
      console.log('No existing data, creating new entry');
      const { data: newData, error: insertError } = await supabase
        .from('meeting_metadata')
        .insert({
          meeting_type: MEETING_TYPE,
          meeting_date: formattedDate,
          current_books: meetingData.currentBooks,
          facilitator: '',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Created new metadata:', newData);
      if (newData) {
        setCurrentBooks(newData.current_books || []);
        setFacilitator(newData.facilitator || '');
      }
    }
  } catch (err) {
    console.error('Error in fetchMeetingMetadata:', err);
  }
};

const handleFacilitatorChange = async (newValue) => {
  try {
    console.log('Updating facilitator with:', {
      date: selectedDate,
      facilitator: newValue,
      books: currentBooks
    });

    // First check if record exists
    const { data: existingData, error: fetchError } = await supabase
      .from('meeting_metadata')
      .select('*')
      .eq('meeting_type', MEETING_TYPE)
      .eq('meeting_date', new Date(selectedDate).toISOString().split('T')[0])
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const { error } = await supabase
      .from('meeting_metadata')
      .upsert({
        id: existingData?.id, // Include if exists
        meeting_type: MEETING_TYPE,
        meeting_date: new Date(selectedDate).toISOString().split('T')[0],
        facilitator: newValue,
        current_books: currentBooks || [],
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Successfully updated facilitator');
    setFacilitator(newValue);
  } catch (err) {
    console.error('Error updating facilitator:', err);
  }
};

const handleBookChange = async (index, newValue) => {
  try {
    const newBooks = [...currentBooks];
    newBooks[index] = newValue;

    const { error } = await supabase
      .from('meeting_metadata')
      .upsert({
        meeting_type: MEETING_TYPE,
        meeting_date: new Date(selectedDate).toISOString().split('T')[0],
        current_books: newBooks,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    setCurrentBooks(newBooks);
  } catch (err) {
    console.error('Error updating books:', err);
  }
};

const handleAddBook = async () => {
  try {
    const newBooks = [...currentBooks, ''];
    console.log('Adding new book:', newBooks); // Debug log

    const { error } = await supabase
      .from('meeting_metadata')
      .upsert({
        meeting_type: MEETING_TYPE,
        meeting_date: new Date(selectedDate).toISOString().split('T')[0],
        current_books: newBooks,
        facilitator: facilitator, // Add this to preserve facilitator
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase error:', error); // Add explicit error logging
      throw error;
    }
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
        
        const { data, error } = await supabase.storage
          .from('meeting-files')
          .upload(filePath, file);
  
        if (error) {
          console.error('Error uploading file:', error);
          return;
        }
      }
      // After upload, fetch the updated list of files
      await fetchFilesForDate(selectedDate);
    } catch (error) {
      console.error('Error in file upload:', error);
    }
  };

// Add this after your existing state declarations
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
          target: '45%',
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
        }
      ]
    },
    {
      category: 'Internal',
      kpis: [
        {
          name: 'Maintenance Checklist Adoption',
          explanation: 'Increase efficiencies, lower cost and improve quality',
          target: '100% adoption',
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
          target: 'Punchlist training. Cut back training with Mark and Scott this Thursday.',
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

  const [selectedTab, setSelectedTab] = useState('guide');
  const [metricsData, setMetricsData] = useState(
    [...meetingData.metrics].sort((a, b) => a.category.localeCompare(b.category))
  );

  // Add these new lines right after your existing state declarations
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const generateBiWeeklyTuesdays = () => {
    const dates = [];
    const startDate = new Date(2025, 1, 18); // Feb 18, 2025
    let currentDate = new Date(startDate);
  
    // Generate dates for 2 years from start date
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 2);
  
    while (currentDate < endDate) {
      dates.push(currentDate.toLocaleDateString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: '2-digit'
      }));
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

  const dates = generateBiWeeklyTuesdays();
  const [selectedDate, setSelectedDate] = useState(findNearestDate(dates));

// Add these new functions first
const fetchKPIData = async (branchId, date) => {
  try {
    console.log('Fetching KPI data:', { branchId, date, MEETING_TYPE });
    setLoading(true);
    const { data, error } = await supabase
      .from('kpi_entries')
      .select('*')
      .eq('meeting_type', MEETING_TYPE)
      .eq('branch_id', branchId)
      .eq('meeting_date', new Date(date).toISOString().split('T')[0]);

    if (error) throw error;

    // If no data exists for this date/branch, create initial entries
    if (data.length === 0) {
      const initialEntries = meetingData.metrics.flatMap(metric => 
        metric.kpis.map(kpi => ({
          meeting_type: MEETING_TYPE,
          branch_id: branchId,
          meeting_date: new Date(date).toISOString().split('T')[0],
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
    return meetingData.metrics; // Fallback to initial data
  } finally {
    setLoading(false);
  }
};

const transformKPIData = (data) => {
  const groupedData = data.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = { category: entry.category, kpis: [] };
    }

    // Find the matching KPI in meetingData to get the explanation
    const originalKPI = meetingData.metrics
      .find(m => m.category === entry.category)
      ?.kpis.find(k => k.name === entry.kpi_name);

    acc[entry.category].kpis.push({
      name: entry.kpi_name,
      target: entry.target,
      actual: entry.actual,
      status: entry.status,
      actions: entry.actions,
      explanation: originalKPI?.explanation || '' // Add back the explanation
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

// Add this new function near your other functions
const addNewFinancialKPI = async (branchId, date) => {
  try {
    // Check if the new KPI already exists
    const { data, error } = await supabase
      .from('kpi_entries')
      .select('*')
      .eq('meeting_type', MEETING_TYPE)
      .eq('branch_id', branchId)
      .eq('meeting_date', new Date(date).toISOString().split('T')[0])
      .eq('category', 'Financial')
      .eq('kpi_name', 'Maintenance Direct Labor Cost (DL%) - Onsites');

    if (error) throw error;

    // If KPI doesn't exist, create it
    if (data.length === 0) {
      const { error: insertError } = await supabase
        .from('kpi_entries')
        .insert({
          meeting_type: MEETING_TYPE,
          branch_id: branchId,
          meeting_date: new Date(date).toISOString().split('T')[0],
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

// Add this useEffect
useEffect(() => {
  console.log('Current tab and date:', { selectedTab, selectedDate });
  if (selectedTab !== 'guide') {
    // First fetch existing data
    fetchKPIData(selectedTab, selectedDate)
      .then(data => {
        console.log('Fetched data:', data);
        setMetricsData(data);
        // Then ensure new KPI exists
        return addNewFinancialKPI(selectedTab, selectedDate);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }
}, [selectedTab, selectedDate]);

useEffect(() => {
  fetchFilesForDate(selectedDate);
}, [selectedDate]);

useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    setUser(user);
  });

  // Add automatic logout on page close
  const handleTabClose = (event) => {
    supabase.auth.signOut();
  };

  window.addEventListener('beforeunload', handleTabClose);

  return () => {
    window.removeEventListener('beforeunload', handleTabClose);
  };
}, []);

// Add this new useEffect
useEffect(() => {
  fetchMeetingMetadata(selectedDate);
}, [selectedDate]);



const handleActualChange = async (mIndex, kIndex, newValue) => {
  const metric = metricsData[mIndex];
  const kpi = metric.kpis[kIndex];

  try {
    const { error } = await supabase
      .from('kpi_entries')
      .update({ 
        actual: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('meeting_type', MEETING_TYPE)
      .eq('branch_id', selectedTab)
      .eq('meeting_date', new Date(selectedDate).toISOString().split('T')[0])
      .eq('category', metric.category)
      .eq('kpi_name', kpi.name);

    if (error) throw error;

    const updatedMetrics = [...metricsData];
    updatedMetrics[mIndex].kpis[kIndex].actual = newValue;
    setMetricsData(updatedMetrics);
  } catch (err) {
    setError(err.message);
  }
};

const handleStatusChange = async (mIndex, kIndex, newValue) => {
  const metric = metricsData[mIndex];
  const kpi = metric.kpis[kIndex];

  try {
    const { error } = await supabase
      .from('kpi_entries')
      .update({ 
        status: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('meeting_type', MEETING_TYPE)
      .eq('branch_id', selectedTab)
      .eq('meeting_date', new Date(selectedDate).toISOString().split('T')[0])
      .eq('category', metric.category)
      .eq('kpi_name', kpi.name);

    if (error) throw error;

    const updatedMetrics = [...metricsData];
    updatedMetrics[mIndex].kpis[kIndex].status = newValue;
    setMetricsData(updatedMetrics);
  } catch (err) {
    console.error('Error updating status:', err);
  }
};

// Add this inside your component, near the top with other handler definitions
const debouncedSaveActions = useMemo(
  () => _.debounce(async (newValue, branchId, date, category, kpiName) => {
    try {
      const { error } = await supabase
        .from('kpi_entries')
        .update({ 
          actions: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('meeting_type', MEETING_TYPE)
        .eq('branch_id', branchId)
        .eq('meeting_date', date)
        .eq('category', category)
        .eq('kpi_name', kpiName);

      if (error) throw error;
    } catch (err) {
      console.error('Error saving action:', err);
    }
  }, 1000),
  []
);

const handleActionsChange = (mIndex, kIndex, newValue) => {
  const metric = metricsData[mIndex];
  const kpi = metric.kpis[kIndex];
  const formattedDate = new Date(selectedDate).toISOString().split('T')[0];

  // Update UI immediately
  const updatedMetrics = [...metricsData];
  updatedMetrics[mIndex].kpis[kIndex].actions = newValue;
  setMetricsData(updatedMetrics);

  // Debounce the save to database
  debouncedSaveActions(newValue, selectedTab, formattedDate, metric.category, kpi.name);
};

// Then define branches (this got mixed up in your code)
const branches = [
  { id: 'SE', name: 'SE Manager', headerColor: 'bg-red-50', icon: seIcon },
  { id: 'N', name: 'N Manager', headerColor: 'bg-green-50', icon: nIcon },
  { id: 'SW', name: 'SW Manager', headerColor: 'bg-blue-50', icon: swIcon },
  { id: 'LV', name: 'LV Manager', headerColor: 'bg-yellow-50', icon: lvIcon }
];

  const tabOptions = [
    { id: 'guide', name: 'Meeting Guide' },
    ...branches
  ];


    return (
      <div className="bg-blue-50 min-h-screen w-full">
        <div className="container mx-auto p-4 space-y-4">

{/* Week Selector and User Profile */}
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
    <img 
      src={agaveLogo} 
      alt="Agave Logo" 
      className="h-8 w-auto"
    />
    <h1 className="text-xl font-semibold">Branch Manager Meeting Agenda</h1>
  </div>
  <div className="flex items-center gap-4">
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
    
    <div className="flex items-center gap-2">
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
</div>

      <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 gap-1">
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
<TabsContent value="guide" className="space-y-4 mt-6">
  {/* First Section: Mission & Current Readings */}
  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
    <div className="bg-blue-900 p-4">
      <h2 className="text-white text-lg font-semibold">Mission & Current Readings</h2>
    </div>
    <div className="bg-white p-4 grid grid-cols-2 gap-4">
  <div>
    <h3 className="font-semibold mb-2">Mission</h3>
    <p>{meetingData.mission}</p>
  </div>
  <div>
    <h3 className="font-semibold mb-2">Current Book Readings</h3>
    <div className="space-y-2">
    {currentBooks.map((book, index) => (
  <div key={index} className="flex items-center gap-2">
    <span>📚</span>
    <input
      type="text"
      value={book || ''}
      onChange={(e) => {
        const newBooks = [...currentBooks];
        newBooks[index] = e.target.value;
        setCurrentBooks(newBooks); // Immediately update UI
        handleBookChange(index, e.target.value);
      }}
      className="w-full px-3 py-2 bg-transparent hover:bg-gray-50 focus:bg-white focus:border focus:rounded-md focus:outline-none"
      placeholder="Enter book title..."
    />
  </div>
))}
      <button
  onClick={() => {
    setCurrentBooks(prev => [...prev, '']); // Immediately update UI
    handleAddBook();
  }}
  className="mt-2 text-blue-500 hover:text-blue-700"
>
  + Add book
</button>
    </div>
  </div>
</div>
  </div>

  {/* Second Section: Meeting Agenda & Facilitation */}
  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
    <div className="bg-blue-900 p-4">
      <h2 className="text-white text-lg font-semibold">Meeting Agenda & Facilitation</h2>
    </div>
    <div className="bg-white p-4">
  <div className="grid grid-cols-2 gap-6">
    <div className="space-y-6">
    <div>
  <h3 className="font-semibold mb-2">Facilitator</h3>
  <input
  type="text"
  value={facilitator}
  onChange={(e) => {
    setFacilitator(e.target.value); // Immediately update UI
    handleFacilitatorChange(e.target.value);
  }}
  className="w-full px-3 py-2 bg-transparent hover:bg-gray-50 focus:bg-white focus:border focus:rounded-md focus:outline-none"
  placeholder="Enter facilitator name..."
/>
</div>

      <div>
        <h3 className="font-semibold mb-2">Group Rules of Engagement</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Confidentiality</li>
          <li>Be present (cell phones and laptops away)</li>
          <li>Come prepared with selected highlights regarding each agenda item</li>
          <li>Follow procedures</li>
          <li>Take notes</li>
          <li>Complete assigned tasks</li>
          <li>Start and end on time</li>
          <li>Lift each other up</li>
        </ul>
      </div>
    </div>

    <div>
      <h3 className="font-semibold mb-2">Agenda</h3>
      <ul className="space-y-4">
        <li className="flex justify-between items-center">
          <span>Check-In</span>
          <span className="text-sm text-gray-500">5 mins</span>
        </li>
      </ul>
    </div>
  </div>
</div>
  </div>

  {/* Third Section: Meeting Files */}
  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
    <div className="bg-blue-900 p-4">
      <h2 className="text-white text-lg font-semibold">Meeting Files & Transcripts</h2>
    </div>
    <div className="bg-white p-4">
    <div 
  className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
  onClick={() => document.getElementById('meeting-files').click()}
>
  <input
    type="file"
    id="meeting-files"
    className="hidden"
    onChange={handleFileUpload}
    multiple
  />
  <div className="flex flex-col items-center">
    <span className="mb-2 text-lg">📁 Upload meeting files or transcripts</span>
    <span className="text-sm text-gray-500">Drop files here or click to upload</span>
  </div>
</div>
{uploadedFiles.length > 0 && (
  <div className="mt-4">
    <h3 className="font-semibold mb-2">Uploaded Files:</h3>
    <ul className="space-y-2">
      {uploadedFiles.map((file, index) => (
        <li key={index} className="flex items-center gap-2">
          <span>📄</span>
          <button
            onClick={async () => {
              try {
                const { data, error } = await supabase.storage
                  .from('meeting-files')
                  .download(file.path);
                if (error) throw error;
                
                // Create download link
                const url = window.URL.createObjectURL(data);
                const link = document.createElement('a');
                link.href = url;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(link);
              } catch (error) {
                console.error('Error downloading file:', error);
              }
            }}
            className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer"
          >
            {file.name}
          </button>
        </li>
      ))}
    </ul>
  </div>
)}
    </div>
  </div>
</TabsContent>

        {/* Branch Tabs */}
        {branches.map(branch => (
          <TabsContent key={branch.id} value={branch.id} className="space-y-4 mt-6">
<div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
  <div className="bg-blue-900 p-4">
    <h2 className="text-lg font-semibold text-white">Strategic Objectives & KPIs</h2>
  </div>
  <div className="bg-white p-4">
    <div className="overflow-x-auto">
    <table className="w-full border-collapse">
  <thead>
    <tr className="border-b border-gray-200">
      <th className="px-4 py-2 text-left font-semibold w-40">Category</th>
      <th className="px-4 py-2 text-left font-semibold w-48">KPI</th>
      <th className="px-4 py-2 text-left font-semibold w-24">Target</th>
      <th className="px-4 py-2 text-left font-semibold w-24">Actual</th>
      <th className="px-4 py-2 text-left font-semibold w-48">Status</th>
      <th className="px-4 py-2 text-left font-semibold">Actions & Deadlines</th>
    </tr>
  </thead>
  <tbody>
    {loading ? (
      <tr>
        <td colSpan="6" className="text-center py-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span>Loading data...</span>
          </div>
        </td>
      </tr>
    ) : metricsData.map((metric, mIndex) => (
      metric.kpis.map((kpi, kIndex) => (
        <tr 
          key={`${mIndex}-${kIndex}`} 
          className={`border-b border-gray-100 ${
            metric.category === 'Client' ? 'bg-blue-50' :
            metric.category === 'Financial' ? 'bg-green-50' :
            metric.category === 'Internal' ? 'bg-purple-50' :
            metric.category === 'People, Learning & Growth' ? 'bg-orange-50' :
            'bg-white'
          }`}
        >
          <td className="px-4 py-2 align-top">
            <div className="font-medium">{metric.category}</div>
            <div className="text-xs text-gray-500 mt-1 pr-2">
              {metric.category === 'Financial' && "Strategic Objective: Increase profitability"}
              {metric.category === 'Client' && "Strategic Objective: Retain Client Business"}
              {metric.category === 'Internal' && "Strategic Objective: Build quality into operational processes"}
              {metric.category === 'People, Learning & Growth' && "Strategic Objective: Increase employee retention, Upskill employees and Develop our safety culture"}
            </div>
          </td>
          <td className="px-4 py-2 align-top">
            <div className="font-medium">{kpi.name}</div>
            {kpi.explanation && (
              <div className="text-xs text-gray-500 mt-1 pr-2">
                {kpi.explanation}
              </div>
            )}
          </td>
          <td className="px-4 py-2 align-top">{kpi.target || '-'}</td>
          <td className="px-4 py-2 align-top"> {/* Changed px-1 to px-4 */}
            <input
              type="text"
              value={kpi.actual || ''}
              onChange={(e) => handleActualChange(mIndex, kIndex, e.target.value)}
              placeholder="..."
              className="w-full px-4 py-2 bg-transparent hover:bg-gray-50 focus:bg-white focus:border focus:rounded-md focus:outline-none" 
            />
          </td>
          <td className="px-4 py-2 align-top">
            <select 
              value={kpi.status}
              onChange={(e) => handleStatusChange(mIndex, kIndex, e.target.value)}
              className="flex items-center w-full px-3 py-2 border rounded-md bg-white"
            >
              <option value="">Select a status...</option>
              <option value="on-track">✅ On Track</option>
              <option value="resolving">⏳ Resolving</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="in-training">📚 In Training</option>
              <option value="off-track">⚠️ Off Track</option>
            </select>
          </td>
          <td className="px-4 py-2">
            <textarea
              value={kpi.actions || ''}
              onChange={(e) => handleActionsChange(mIndex, kIndex, e.target.value)}
              placeholder="Enter actions & deadlines..."
              className="w-full px-3 py-2 bg-transparent hover:bg-gray-50 focus:bg-white focus:border focus:rounded-md focus:outline-none resize-none"
              style={{
                height: '5rem',
                overflowY: 'auto'
              }}
            />
          </td>
        </tr>
      ))
    ))}
  </tbody>
</table>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  </div>
  );
};

export default BranchManagerMeeting;