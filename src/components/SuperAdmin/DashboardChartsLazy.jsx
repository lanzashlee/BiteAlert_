import React, { memo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Line as LineChart, Bar as BarChart, Pie as PieChart } from 'react-chartjs-2';

// Register Chart.js components immediately
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

// Direct imports render immediately without Suspense fallback

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
          <div className="panel-body" style={{height: 300, position: 'relative'}}>
            <LineChart data={patientsChartData} options={lineChartOptions} />
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Cases per Center chart">
          <div className="panel-heading">
            <h3 className="panel-title">Case Distribution</h3>
          </div>
          <div className="panel-body" style={{height: 300, position: 'relative'}}>
            <BarChart data={casesChartData} options={barChartOptions} />
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Vaccine stocks trend chart">
          <div className="panel-heading">
            <h3 className="panel-title">Vaccine Stock Levels</h3>
          </div>
          <div className="panel-body" style={{height: 300, position: 'relative'}}>
            <LineChart data={vaccinesChartData} options={vaccinesChartOptions} />
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Case severity distribution chart">
          <div className="panel-heading">
            <h3 className="panel-title">Case Severity</h3>
          </div>
          <div className="panel-body" style={{height: 300, position: 'relative'}}>
            <PieChart data={severityChartData} options={severityChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default DashboardChartsLazy;


