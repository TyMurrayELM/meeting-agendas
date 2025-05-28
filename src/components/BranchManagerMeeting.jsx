import React, { useState, useEffect, useMemo, useRef } from 'react';
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
// Import icons
import seIcon from '../assets/icons/se.png';
import nIcon from '../assets/icons/n.png';
import swIcon from '../assets/icons/sw.png';
import lvIcon from '../assets/icons/lv.png';
// Add new irrigation icon import
import irrIcon from '../assets/icons/irr.png';

// Meeting type constant
const MEETING_TYPE = 'bm-meeting';

// Custom hook for auto-resizing textareas
const useAutoResizeTextarea = (value) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set the height to the scrollHeight (content height)
      // Math.min ensures it doesn't exceed maxHeight (20rem = 320px)
      textarea.style.height = `${Math.min(textarea.scrollHeight, 320)}px`;
    }
  }, [value]); // Re-calculate when value changes

  return textareaRef;
};

// Auto-resize textarea component
const AutoResizeTextarea = ({ value, onChange, placeholder, className, style }) => {
  const textareaRef = useAutoResizeTextarea(value);
  
  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      style={{
        ...style,
        minHeight: '5rem',
        maxHeight: '20rem',
        overflowY: 'auto'
      }}
    />
  );
};

// Simple markdown parser for bold, italic, and lists
const parseMarkdown = (text) => {
  if (!text) return '';
  
  // Convert markdown to HTML
  let html = text
    // Bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* or _text_
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br />')
    // Bullet points: - item
    .replace(/^- (.+)$/gm, '• $1')
    // Numbered lists: 1. item
    .replace(/^\d+\. (.+)$/gm, (match, p1, offset, string) => {
      const lines = string.substring(0, offset).split('\n');
      const currentLineIndex = lines.length;
      const prevLine = lines[currentLineIndex - 2];
      const isFirstNumberedItem = !prevLine || !/^\d+\./.test(prevLine);
      return `${isFirstNumberedItem ? '<br />' : ''}${match}`;
    });
    
  return html;
};

// Rich Text Actions component
const RichTextActions = ({ value, onChange, placeholder }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const textareaRef = useAutoResizeTextarea(localValue);
  
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);
  
  const handleSave = () => {
    onChange({ target: { value: localValue } });
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setLocalValue(value || '');
    setIsEditing(false);
  };
  
  const insertFormatting = (prefix, suffix = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = localValue;
    const selectedText = text.substring(start, end);
    
    const newText = 
      text.substring(0, start) + 
      prefix + selectedText + suffix + 
      text.substring(end);
    
    setLocalValue(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText ? end + prefix.length + suffix.length : start + prefix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  
  if (!isEditing) {
    return (
      <div 
        className="w-full px-3 py-2 bg-white border border-black rounded-md min-h-[5rem] max-h-[20rem] overflow-y-auto cursor-pointer hover:bg-gray-50"
        onClick={() => setIsEditing(true)}
      >
        {localValue ? (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(localValue) }}
          />
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="flex gap-1 mb-1 p-1 bg-gray-100 rounded-t-md border border-b-0 border-black">
        <button
          type="button"
          onClick={() => insertFormatting('**')}
          className="px-2 py-1 text-sm font-bold hover:bg-gray-200 rounded"
          title="Bold (** text **)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertFormatting('*')}
          className="px-2 py-1 text-sm italic hover:bg-gray-200 rounded"
          title="Italic (* text *)"
        >
          I
        </button>
        <div className="border-l border-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => insertFormatting('- ', '')}
          className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
          title="Bullet point"
        >
          • List
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1 text-sm bg-green-500 text-white hover:bg-green-600 rounded"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1 text-sm bg-gray-300 hover:bg-gray-400 rounded"
        >
          Cancel
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white border border-black hover:bg-gray-50 focus:bg-white focus:border rounded-b-md focus:outline-none resize-y"
        style={{
          minHeight: '5rem',
          maxHeight: '20rem',
          overflowY: 'auto'
        }}
      />
      <div className="text-xs text-gray-500 mt-1">
        Tip: Use **text** for bold, *text* for italic, - for bullet points
      </div>
    </div>
  );
};

const BranchManagerMeeting = () => {
  // Function to render status options
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
              case 'serious-issue':
                return <div className="flex items-center gap-2"><AlertTriangle className="text-red-700 animate-pulse" /> Serious Issue</div>;
      case '':
        return <div className="text-gray-400">Status needed</div>;
      default:
        return status;
    }
  };

  // State variables
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [currentBooks, setCurrentBooks] = useState([]);
  const [facilitator, setFacilitator] = useState('');
  const [selectedTab, setSelectedTab] = useState('guide');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [irrigationBranchId, setIrrigationBranchId] = useState('IRR-SE');
  
  const agaveLogo = new URL('../assets/logos/agave.png', import.meta.url).href
  const pendingSavesRef = useRef(null);

  // Function to create a fresh set of irrigation KPIs
  const getIrrigationKPIs = () => {
    // Define exactly which KPIs should appear for irrigation
    return [
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
  };
  
  // Function to fetch irrigation data for a specific branch
  const fetchIrrigationData = async (branchId) => {
    try {
      setLoading(true);
      const formattedDate = new Date(selectedDate).toISOString().split('T')[0];
      console.log('fetchIrrigationData called:', { branchId, date: formattedDate });
      
      // Cancel any pending saves before fetching
      if (pendingSavesRef.current) {
        pendingSavesRef.current.cancel();
        pendingSavesRef.current.flush(); // Force execute any pending saves
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure saves complete
      }
      
      const irrigationTemplate = getIrrigationKPIs();
      
      const { data, error } = await supabase
        .from('kpi_entries')
        .select('*')
        .eq('meeting_type', MEETING_TYPE)
        .eq('branch_id', branchId)
        .eq('meeting_date', formattedDate);
      
      if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
      }
      
      console.log(`Fetched ${data.length} records for ${branchId}`);
      
      if (data && data.length > 0) {
        // Map the data to our template structure
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
        
        console.log('Setting transformed data:', transformedData);
        setMetricsData(transformedData);
      } else {
        // No data exists, create initial entries
        console.log('Creating initial entries for:', branchId);
        
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

        console.log('Inserting initial entries:', initialEntries);

        const { data: newData, error: insertError } = await supabase
          .from('kpi_entries')
          .insert(initialEntries)
          .select();

        if (insertError) {
          console.error('Insert error:', insertError);
          // Still show the template even if insert fails
          setMetricsData(irrigationTemplate);
        } else {
          console.log('Successfully created initial entries');
          setMetricsData(irrigationTemplate);
        }
      }
    } catch (err) {
      console.error('Error in fetchIrrigationData:', err);
      setMetricsData(getIrrigationKPIs());
    } finally {
      setLoading(false);
    }
  };

  // Add handler for irrigation data changes
  const handleIrrigationActualChange = async (mIndex, kIndex, newValue) => {
    const metric = metricsData[mIndex];
    const kpi = metric.kpis[kIndex];

    try {
      const { data, error } = await supabase
        .from('kpi_entries')
        .upsert({ 
          meeting_type: MEETING_TYPE,
          branch_id: irrigationBranchId,
          meeting_date: new Date(selectedDate).toISOString().split('T')[0],
          category: metric.category,
          kpi_name: kpi.name,
          actual: newValue,
          status: kpi.status || 'in-progress',
          actions: kpi.actions || '',
          target: kpi.target || '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'meeting_type,branch_id,meeting_date,category,kpi_name'
        })
        .select()
        .single();

      if (error) throw error;

      const updatedMetrics = [...metricsData];
      updatedMetrics[mIndex].kpis[kIndex].actual = newValue;
      setMetricsData(updatedMetrics);
      console.log('Successfully updated irrigation actual value');
    } catch (err) {
      console.error('Error updating actual:', err);
      setError(err.message);
    }
  };

  const handleIrrigationStatusChange = async (mIndex, kIndex, newValue) => {
    const metric = metricsData[mIndex];
    const kpi = metric.kpis[kIndex];

    try {
      const { data, error } = await supabase
        .from('kpi_entries')
        .upsert({ 
          meeting_type: MEETING_TYPE,
          branch_id: irrigationBranchId,
          meeting_date: new Date(selectedDate).toISOString().split('T')[0],
          category: metric.category,
          kpi_name: kpi.name,
          actual: kpi.actual || '',
          status: newValue,
          actions: kpi.actions || '',
          target: kpi.target || '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'meeting_type,branch_id,meeting_date,category,kpi_name'
        })
        .select()
        .single();

      if (error) throw error;

      const updatedMetrics = [...metricsData];
      updatedMetrics[mIndex].kpis[kIndex].status = newValue;
      setMetricsData(updatedMetrics);
      console.log('Successfully updated irrigation status');
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleIrrigationActionsChange = (mIndex, kIndex, newValue) => {
    const metric = metricsData[mIndex];
    const kpi = metric.kpis[kIndex];
    const formattedDate = new Date(selectedDate).toISOString().split('T')[0];

    console.log('handleIrrigationActionsChange called:', {
      mIndex,
      kIndex,
      newValue,
      branchId: irrigationBranchId,
      kpiName: kpi.name
    });

    // Update UI immediately
    const updatedMetrics = [...metricsData];
    updatedMetrics[mIndex].kpis[kIndex].actions = newValue;
    setMetricsData(updatedMetrics);

    // Cancel any pending save for this field
    if (pendingSavesRef.current) {
      pendingSavesRef.current.cancel();
    }

    // Save to database with debounce
    debouncedSaveIrrigationActions(
      newValue, 
      irrigationBranchId, 
      formattedDate, 
      metric.category, 
      kpi.name, 
      kpi
    );
  };

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

  const [metricsData, setMetricsData] = useState(
    [...meetingData.metrics].sort((a, b) => a.category.localeCompare(b.category))
  );

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

  // Memoized debounced functions
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

  const debouncedSaveIrrigationActions = useMemo(
    () => {
      const saveFunction = async (newValue, branchId, date, category, kpiName, currentKpi) => {
        try {
          console.log('Saving irrigation actions:', {
            meeting_type: MEETING_TYPE,
            branch_id: branchId,
            meeting_date: date,
            category: category,
            kpi_name: kpiName,
            actions: newValue
          });

          // Upsert will now work correctly with the unique constraint
          const { data, error } = await supabase
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
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase error:', error);
            throw error;
          }
          
          console.log('Successfully saved irrigation actions:', data);
        } catch (err) {
          console.error('Error saving irrigation action:', err);
        }
      };

      const debouncedFn = _.debounce(saveFunction, 500);
      // Store reference for cancellation
      pendingSavesRef.current = debouncedFn;
      return debouncedFn;
    },
    [] // No dependencies, created once
  );

  // Effect hooks
  useEffect(() => {
    const loadData = async () => {
      // Wait for any pending saves to complete
      if (pendingSavesRef.current) {
        pendingSavesRef.current.flush();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('useEffect triggered:', { selectedTab, selectedDate, irrigationBranchId });
      
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

  useEffect(() => {
    fetchMeetingMetadata(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      // Cleanup: flush any pending saves when component unmounts
      if (pendingSavesRef.current) {
        pendingSavesRef.current.flush();
      }
    };
  }, []);

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

  const handleActionsChange = (mIndex, kIndex, newValue) => {
    const metric = metricsData[mIndex];
    const kpi = metric.kpis[kIndex];
    const formattedDate = new Date(selectedDate).toISOString().split('T')[0];

    // Update UI immediately
    const updatedMetrics = [...metricsData];
    updatedMetrics[mIndex].kpis[kIndex].actions = newValue;
    setMetricsData(updatedMetrics);

    // Debounce the save to database
    debouncedSaveActions(newValue, selectedTab, formattedDate, metric.category, kpi.name, kpi);
  };

  // Modified branches array to include Irrigation
  const branches = [
    { id: 'SE', name: 'SE Manager', headerColor: 'bg-red-50', icon: seIcon },
    { id: 'N', name: 'N Manager', headerColor: 'bg-green-50', icon: nIcon },
    { id: 'SW', name: 'SW Manager', headerColor: 'bg-blue-50', icon: swIcon },
    { id: 'LV', name: 'LV Manager', headerColor: 'bg-yellow-50', icon: lvIcon },
    { id: 'IRR', name: 'Irrigation', headerColor: 'bg-teal-50', icon: irrIcon }
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
            <h1 className="text-xl font-semibold">Branch Meeting Dashboard</h1>
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
                          className="w-full px-3 py-2 bg-transparent hover:bg-gray-50 focus:bg-white focus:border rounded-md focus:outline-none"
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
                        className="w-full px-3 py-2 bg-transparent hover:bg-gray-50 focus:bg-white focus:border rounded-md focus:outline-none"
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
          {branches.map(branch => {
            // Check if this is the Irrigation tab
            if (branch.id === 'IRR') {
              return (
                <TabsContent key={branch.id} value={branch.id} className="space-y-4 mt-6">
                  <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    <div className="bg-teal-700 p-4">
                      <h2 className="text-lg font-semibold text-white">Irrigation by Branch</h2>
                    </div>
                    <div className="bg-white p-4">
                      {/* Sub-tabs for branches within Irrigation */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium mb-3">Select Branch:</h3>
                        <div className="flex space-x-2">
                          {branches.filter(b => b.id !== 'IRR').map(subBranch => (
                            <button
                              key={subBranch.id}
                              onClick={() => {
                                // Create a branch-specific ID for irrigation data
                                const newIrrigationBranchId = `IRR-${subBranch.id}`;
                                // Update the state
                                setIrrigationBranchId(newIrrigationBranchId);
                                // Fetch data for this branch
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
                      
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full border-collapse">
                          <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-gray-200">
                              <th className="px-4 py-2 text-left font-semibold w-40">Category</th>
                              <th className="px-4 py-2 text-left font-semibold w-48">KPI</th>
                              <th className="px-4 py-2 text-left font-semibold w-32">Target</th>
                              <th className="px-4 py-2 text-left font-semibold w-32">Actual</th>
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
                                      {metric.category === 'Financial' && "Meeting Revenue per Tech Targets"}
                                      {metric.category === 'Client' && "Linigering Irrigation Jobs or Rennovation Opportunities"}
                                      {metric.category === 'Internal' && "Utilizing Irrigation Process and Supporting other Departments"}
                                      {metric.category === 'People, Learning & Growth' && "Strategic Objective: Develop skilled irrigation technicians"}
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
                                  <td className="px-4 py-2 align-top">
                                    <div className="leading-normal align-top">{kpi.target || '-'}</div>
                                  </td>
                                  <td className="px-4 py-2 align-top">
                                    <input
                                      type="text"
                                      value={kpi.actual || ''}
                                      onChange={(e) => {
                                        if (selectedTab === 'IRR') {
                                          handleIrrigationActualChange(mIndex, kIndex, e.target.value);
                                        } else {
                                          handleActualChange(mIndex, kIndex, e.target.value);
                                        }
                                      }}
                                      placeholder="..."
                                      className="w-full px-4 py-2 bg-white border border-black hover:bg-gray-50 focus:bg-white focus:border rounded-md focus:outline-none align-top leading-normal text-center"
                                    />
                                  </td>
                                  <td className="px-4 py-2 align-top">
                                    <select 
                                      value={kpi.status}
                                      onChange={(e) => {
                                        if (selectedTab === 'IRR') {
                                          handleIrrigationStatusChange(mIndex, kIndex, e.target.value);
                                        } else {
                                          handleStatusChange(mIndex, kIndex, e.target.value);
                                        }
                                      }}
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
                                    {/* RICH TEXT EDITOR FOR IRRIGATION TAB */}
                                    <RichTextActions
                                      value={kpi.actions || ''}
                                      onChange={(e) => {
                                        if (selectedTab === 'IRR') {
                                          handleIrrigationActionsChange(mIndex, kIndex, e.target.value);
                                        } else {
                                          handleActionsChange(mIndex, kIndex, e.target.value);
                                        }
                                      }}
                                      placeholder="Enter actions & deadlines..."
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
              );
            }
            
            // For all other non-irrigation tabs
            return (
              <TabsContent key={branch.id} value={branch.id} className="space-y-4 mt-6">
                <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
                  <div className="bg-blue-900 p-4">
                    <h2 className="text-lg font-semibold text-white">Strategic Objectives & KPIs</h2>
                  </div>
                  <div className="bg-white p-4">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left font-semibold w-40">Category</th>
                            <th className="px-4 py-2 text-left font-semibold w-48">KPI</th>
                            <th className="px-4 py-2 text-left font-semibold w-32">Target</th>
                            <th className="px-4 py-2 text-left font-semibold w-32">Actual</th>
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
                                <td className="px-4 py-2 align-top">
                                  <div className="leading-normal align-top">{kpi.target || '-'}</div>
                                </td>
                                <td className="px-4 py-2 align-top">
                                  <input
                                    type="text"
                                    value={kpi.actual || ''}
                                    onChange={(e) => {
                                      if (selectedTab === 'IRR') {
                                        handleIrrigationActualChange(mIndex, kIndex, e.target.value);
                                      } else {
                                        handleActualChange(mIndex, kIndex, e.target.value);
                                      }
                                    }}
                                    placeholder="..."
                                    className="w-full px-4 py-2 bg-white border border-black hover:bg-gray-50 focus:bg-white focus:border rounded-md focus:outline-none align-top leading-normal text-center"
                                  />
                                </td>
                                <td className="px-4 py-2 align-top">
                                  <select 
                                    value={kpi.status}
                                    onChange={(e) => {
                                      if (selectedTab === 'IRR') {
                                        handleIrrigationStatusChange(mIndex, kIndex, e.target.value);
                                      } else {
                                        handleStatusChange(mIndex, kIndex, e.target.value);
                                      }
                                    }}
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
                                  {/* RICH TEXT EDITOR FOR MAIN BRANCH TABS */}
                                  <RichTextActions
                                    value={kpi.actions || ''}
                                    onChange={(e) => {
                                      if (selectedTab === 'IRR') {
                                        handleIrrigationActionsChange(mIndex, kIndex, e.target.value);
                                      } else {
                                        handleActionsChange(mIndex, kIndex, e.target.value);
                                      }
                                    }}
                                    placeholder="Enter actions & deadlines..."
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
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default BranchManagerMeeting;