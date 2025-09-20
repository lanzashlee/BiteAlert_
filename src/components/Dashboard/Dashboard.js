import React from 'react';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('userData') || 'null');
  return (
    <div className="container" style={{ paddingTop: 100 }}>
      <h1>Dashboard</h1>
      <p>Welcome {user ? `${user.firstName || ''} ${user.lastName || ''}` : ''}</p>
      <p>This is the general dashboard page.</p>
    </div>
  );
};

export default Dashboard;

 