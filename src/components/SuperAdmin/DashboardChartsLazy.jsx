import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';

const DashboardChartsLazy = ({
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
            <Line data={patientsChartData} options={lineChartOptions} />
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Cases per Center chart">
          <div className="panel-heading">
            <h3 className="panel-title">Case Distribution</h3>
          </div>
          <div className="panel-body">
            <Bar data={casesChartData} options={barChartOptions} />
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Vaccine stocks trend chart">
          <div className="panel-heading">
            <h3 className="panel-title">Vaccine Stock Levels</h3>
          </div>
          <div className="panel-body">
            <Line data={vaccinesChartData} options={vaccinesChartOptions} />
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="panel panel-default" aria-label="Case severity distribution chart">
          <div className="panel-heading">
            <h3 className="panel-title">Case Severity</h3>
          </div>
          <div className="panel-body">
            <Pie data={severityChartData} options={severityChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardChartsLazy;


