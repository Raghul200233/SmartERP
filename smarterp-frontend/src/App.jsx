import React, { useEffect } from 'react';
import { AppRoutes } from './AppRoutes';
import { useCompanyStore } from './store/companyStore';
import { useDashboardStore } from './store/dashboardStore';
import { dashboardService } from './services/dashboard.service';

function App() {
  const { currentCompany } = useCompanyStore();
  const { setDashboardData, setLoading } = useDashboardStore();

  // Only fetch dashboard data when company changes
  useEffect(() => {
    if (currentCompany) {
      fetchDashboardData();
    }
  }, [currentCompany]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getOverview(currentCompany.id);
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return <AppRoutes />;
}

export default App;