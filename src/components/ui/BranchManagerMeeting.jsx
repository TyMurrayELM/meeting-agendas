import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Check, AlertTriangle, Timer } from 'lucide-react';

const BranchManagerMeeting = () => {
  const renderStatus = (status) => {
    switch (status) {
      case 'on-track':
        return <div className="flex items-center"><Check className="text-green-500 mr-2" /> On Track</div>;
      case 'resolving':
        return <div className="flex items-center"><Timer className="text-yellow-500 mr-2" /> Resolving</div>;
      case 'in-progress':
        return <div className="flex items-center"><Timer className="text-blue-500 mr-2" /> In Progress</div>;
      case 'in-training':
        return <div className="flex items-center"><Timer className="text-purple-500 mr-2" /> In Training</div>;
      case 'off-track':
        return <div className="flex items-center"><AlertTriangle className="text-red-500 mr-2" /> Off Track</div>;
      default:
        return status;
    }
  };

// Current code
const [selectedTab, setSelectedTab] = useState('guide');
const [selectedWeek, setSelectedWeek] = useState({
  week: 5,
  date: '2/4/25'
});

// Add these new lines after
const [branchData, setBranchData] = useState({});

// Then add these useEffect hooks right here (Step 2)
useEffect(() => {
  const savedData = localStorage.getItem('branchManagerData');
  if (savedData) {
    setBranchData(JSON.parse(savedData));
  }
}, []);

useEffect(() => {
  localStorage.setItem('branchManagerData', JSON.stringify(branchData));
}, [branchData]);

  const weeks = [
    { week: 5, date: '2/4/25' },
    { week: 4, date: '1/28/25' },
    { week: 3, date: '1/21/25' },
    { week: 2, date: '1/14/25' },
    { week: 1, date: '1/7/25' }
  ];

  const branches = [
    { id: 'SE', name: 'SE Manager', headerColor: 'bg-red-50' },
    { id: 'N', name: 'N Manager', headerColor: 'bg-green-50' },
    { id: 'SW', name: 'SW Manager', headerColor: 'bg-blue-50' },
    { id: 'LV', name: 'LV Manager', headerColor: 'bg-yellow-50' }
  ];

  const meetingData = {
    mission: "Uplifting & Enriching our people & the properties we maintain",
    currentBooks: ["Seven habits of highly effective people", "Raving fans"],
    metrics: [
      {
        category: 'Financial',
        kpis: [
          {
            name: 'Maintenance Direct Labor Cost (DL%)',
            target: '45%',
            actual: '44.5%',
            status: 'on-track',
            actions: 'On Track for Maintenance Crews. Off Track for Onsites.'
          }
        ]
      },
      {
        category: 'Client',
        kpis: [
          {
            name: 'Hot Properties',
            properties: ['Chandler Airport Center', 'Pacifica Properties', '3204 S Signal Butte'],
            status: 'resolving',
            actions: 'Working on resolution'
          }
        ]
      },
      {
        category: 'Internal',
        kpis: [
          {
            name: 'Maintenance Checklist Adoption',
            target: '100% adoption',
            actual: 'In progress',
            status: 'in-training',
            actions: 'Working with Crews to understand and utilize the new checklist system'
          },
          {
            name: 'Fleet Management',
            status: 'in-progress',
            actions: 'Regular maintenance checks'
          },
          {
            name: 'Safety Compliance',
            status: 'on-track',
            actions: 'SAFE DRIVING!!!'
          }
        ]
      },
      {
        category: 'People, Learning & Growth',
        kpis: [
          {
            name: 'Hiring Needs',
            target: 'Fill critical positions',
            actual: 'In progress',
            status: 'in-progress',
            actions: '2 Irrigators needed (lost 1 recently and need 1 more to move Israel into manager position)'
          },
          {
            name: 'Training & Development',
            status: 'in-progress',
            actions: 'Punchlist training. Cut back training with Mark and Scott this Thursday.'
          },
          {
            name: 'Safety Culture',
            status: 'on-track',
            actions: 'Daily safety talks and procedures being followed'
          }
        ]
      }
    ]
  };

  const tabOptions = [
    { id: 'guide', name: 'Meeting Guide' },
    ...branches
  ];

  const getCurrentData = (branchId) => {
    const weekKey = `${selectedWeek.week}-${selectedWeek.date}`;
    if (!branchData[weekKey] || !branchData[weekKey][branchId]) {
      return meetingData;
    }
    return branchData[weekKey][branchId];
  };
  
  const handleDataUpdate = (branchId, category, kpiIndex, field, value) => {
    const weekKey = `${selectedWeek.week}-${selectedWeek.date}`;
    setBranchData(prevData => {
      const newData = { ...prevData };
      if (!newData[weekKey]) {
        newData[weekKey] = {};
      }
      if (!newData[weekKey][branchId]) {
        newData[weekKey][branchId] = { ...meetingData };
      }
      
      const metrics = [...newData[weekKey][branchId].metrics];
      const metricIndex = metrics.findIndex(m => m.category === category);
      const updatedKpi = { ...metrics[metricIndex].kpis[kpiIndex], [field]: value };
      metrics[metricIndex].kpis[kpiIndex] = updatedKpi;
      
      newData[weekKey][branchId] = {
        ...newData[weekKey][branchId],
        metrics
      };
      
      return newData;
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Week Selector */}
      <div className="flex justify-end mb-4">
        <div className="relative">
          <select 
            value={`Week ${selectedWeek.week}: ${selectedWeek.date}`}
            onChange={(e) => {
              const [week, date] = e.target.value.match(/Week (\d+): (.+)/).slice(1);
              setSelectedWeek({ week: parseInt(week), date });
            }}
            className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-4 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {weeks.map(week => (
              <option key={week.week} value={`Week ${week.week}: ${week.date}`}>
                Week {week.week}: {week.date}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path clipRule="evenodd" fillRule="evenodd" d="M10 12l-5-5h10l-5 5z" />
            </svg>
          </div>
        </div>
      </div>

      <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          {tabOptions.map(tab => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id} 
              className={`
                ${tab.id === 'SE' ? 'bg-red-50 hover:bg-red-100' : ''}
                ${tab.id === 'N' ? 'bg-green-50 hover:bg-green-100' : ''}
                ${tab.id === 'SW' ? 'bg-blue-50 hover:bg-blue-100' : ''}
                ${tab.id === 'LV' ? 'bg-yellow-50 hover:bg-yellow-100' : ''}
              `}
            >
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        {/* Meeting Guide Tab */}
       <TabsContent value="guide" className="space-y-4">
         {/* First Section: Mission & Current Readings */}
         <div>
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
               <ul className="list-disc pl-4">
                 {meetingData.currentBooks.map((book, index) => (
                   <li key={index}>{book}</li>
                 ))}
               </ul>
             </div>
           </div>
         </div>

         {/* Second Section: Meeting Agenda & Facilitation */}
         <div>
           <div className="bg-blue-900 p-4">
             <h2 className="text-white text-lg font-semibold">Meeting Agenda & Facilitation</h2>
           </div>
           <div className="bg-white p-4 space-y-6">
             <div>
               <h3 className="font-semibold mb-2">Facilitator</h3>
               <p>Rotation schedule for facilitator (to decide as a team)</p>
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
             <div>
               <h3 className="font-semibold mb-2">Agenda</h3>
               <ul className="space-y-4">
                 <li className="flex justify-between items-center">
                   <span>Check-In</span>
                   <span className="text-sm text-gray-500">5 mins</span>
                 </li>
                 {/* Add other agenda items here */}
               </ul>
             </div>
           </div>
         </div>
       </TabsContent>

       {/* Branch Tabs */}
       {branches.map(branch => (
         <TabsContent key={branch.id} value={branch.id} className="space-y-4">
           <div>
             <div className={`${branch.headerColor} p-4`}>
               <h2 className="text-lg font-semibold">Strategic Objectives & KPIs</h2>
             </div>
             <div className="bg-white p-4">
               <div className="overflow-x-auto">
                 <table className="w-full border-collapse">
                   <thead>
                     <tr className="border-b border-gray-200">
                       <th className="px-4 py-2 text-left font-semibold">Category</th>
                       <th className="px-4 py-2 text-left font-semibold">KPI</th>
                       <th className="px-4 py-2 text-left font-semibold">Target</th>
                       <th className="px-4 py-2 text-left font-semibold">Actual</th>
                       <th className="px-4 py-2 text-left font-semibold">Status</th>
                       <th className="px-4 py-2 text-left font-semibold">Actions & Deadlines</th>
                     </tr>
                   </thead>
                   <tbody>
                   {getCurrentData(branch.id).metrics.map((metric, mIndex) => (
                       metric.kpis.map((kpi, kIndex) => (
<tr key={`${mIndex}-${kIndex}`} className="border-b border-gray-100">
  <td className="px-4 py-2 font-medium">{metric.category}</td>
  <td className="px-4 py-2">{kpi.name}</td>
  <td className="px-4 py-2">
    <input
      type="text"
      value={kpi.target || ''}
      onChange={(e) => handleDataUpdate(branch.id, metric.category, kIndex, 'target', e.target.value)}
      className="w-full border rounded px-2 py-1"
    />
  </td>
  <td className="px-4 py-2">
    <input
      type="text"
      value={kpi.actual || ''}
      onChange={(e) => handleDataUpdate(branch.id, metric.category, kIndex, 'actual', e.target.value)}
      className="w-full border rounded px-2 py-1"
    />
  </td>
  <td className="px-4 py-2">
    <select
      value={kpi.status || ''}
      onChange={(e) => handleDataUpdate(branch.id, metric.category, kIndex, 'status', e.target.value)}
      className="w-full border rounded px-2 py-1"
    >
      <option value="">Select status</option>
      <option value="on-track">On Track</option>
      <option value="resolving">Resolving</option>
      <option value="in-progress">In Progress</option>
      <option value="in-training">In Training</option>
      <option value="off-track">Off Track</option>
    </select>
  </td>
  <td className="px-4 py-2">
    <input
      type="text"
      value={kpi.actions || ''}
      onChange={(e) => handleDataUpdate(branch.id, metric.category, kIndex, 'actions', e.target.value)}
      className="w-full border rounded px-2 py-1"
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
 );
};

export default BranchManagerMeeting;