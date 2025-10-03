import React, { memo, lazy, Suspense } from 'react';

// Lazy load individual chart components to reduce initial bundle size
const LineChart = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const BarChart = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const PieChart = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));

// Chart loading fallback
const ChartFallback = ({ height = 300 }) => (
  <div style={{ 
    height, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  }}>
    <div style={{ textAlign: 'center', color: '#6c757d' }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 10px'
      }}></div>
      <div>Loading chart...</div>
    </div>
  </div>
);

const DashboardChartsLazy = memo(({
  patientsChartData,
  casesChartData,
  vaccinesChartData,
  severityChartData,
  lineChartOptions,
  barChartOptions,
  vaccinesChartOptions,
  severityChartOptions
}) => {
  return (
    <div className="row" aria-live="polite">
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Patient Growth chart">
          <div className="panel-heading">
            <h3 className="panel-title">Patient Growth</h3>
          </div>
          <div className="panel-body">
            <Suspense fallback={<ChartFallback height={300} />}>
              <LineChart data={patientsChartData} options={lineChartOptions} />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Cases per Center chart">
          <div className="panel-heading">
            <h3 className="panel-title">Case Distribution</h3>
          </div>
          <div className="panel-body">
            <Suspense fallback={<ChartFallback height={300} />}>
              <BarChart data={casesChartData} options={barChartOptions} />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Vaccine stocks trend chart">
          <div className="panel-heading">
            <h3 className="panel-title">Vaccine Stock Levels</h3>
          </div>
          <div className="panel-body">
            <Suspense fallback={<ChartFallback height={300} />}>
              <LineChart data={vaccinesChartData} options={vaccinesChartOptions} />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Case severity distribution chart">
          <div className="panel-heading">
            <h3 className="panel-title">Case Severity</h3>
          </div>
          <div className="panel-body">
            <Suspense fallback={<ChartFallback height={300} />}>
              <PieChart data={severityChartData} options={severityChartOptions} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
});

export default DashboardChartsLazy;


