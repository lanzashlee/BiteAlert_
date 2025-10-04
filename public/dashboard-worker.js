// Web Worker for dashboard data processing to reduce main thread blocking
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'PROCESS_CHART_DATA':
      try {
        const processedData = processChartData(data);
        self.postMessage({ type: 'CHART_DATA_PROCESSED', data: processedData });
      } catch (error) {
        self.postMessage({ type: 'ERROR', error: error.message });
      }
      break;
      
    case 'PROCESS_PATIENT_DATA':
      try {
        const processedData = processPatientData(data);
        self.postMessage({ type: 'PATIENT_DATA_PROCESSED', data: processedData });
      } catch (error) {
        self.postMessage({ type: 'ERROR', error: error.message });
      }
      break;
      
    default:
      self.postMessage({ type: 'ERROR', error: 'Unknown message type' });
  }
};

function processChartData(data) {
  // Process chart data in worker to reduce main thread blocking
  if (!data || !Array.isArray(data)) return { labels: [], datasets: [] };
  
  const labels = data.map(item => item.label || item.date || item.name);
  const values = data.map(item => item.value || item.count || 0);
  
  return {
    labels,
    datasets: [{
      data: values,
      backgroundColor: 'rgba(128, 0, 0, 0.1)',
      borderColor: '#800000',
      borderWidth: 2
    }]
  };
}

function processPatientData(data) {
  // Process patient data in worker to reduce main thread blocking
  if (!data || !Array.isArray(data)) return [];
  
  return data.map(patient => ({
    id: patient.id,
    name: patient.name,
    center: patient.center,
    dateRegistered: patient.dateRegistered,
    caseCount: patient.cases ? patient.cases.length : 0
  }));
}
