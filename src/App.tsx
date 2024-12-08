import { BrowserRouter } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, SetOutline, SetOutline as ToolOutline } from 'antd-mobile-icons';
import { Home, Records, Statistics, Settings, Maintenance } from './pages';
import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';
import { useChargingStore } from './stores/chargingStore';

const TabBarWrapper = () => {
  const navigate = useNavigate();
  const { loadRecords, calculateMonthlyStats } = useChargingStore();
  
  useEffect(() => {
    const initializeData = async () => {
      await loadRecords();
      // 確保在加載記錄後更新當月統計
      const currentMonth = new Date().toISOString().slice(0, 7);
      await calculateMonthlyStats(currentMonth);
    };

    initializeData();
  }, [loadRecords, calculateMonthlyStats]);
  
  return (
    <TabBar onChange={value => navigate(value)}>
      <TabBar.Item
        title="首頁"
        icon={<AppOutline />}
        key="/"
      />
      <TabBar.Item
        title="充電記錄"
        icon={<UnorderedListOutline />}
        key="/records"
      />
      <TabBar.Item
        title="統計"
        icon={<UnorderedListOutline />}
        key="/statistics"
      />
      <TabBar.Item
        title="維修紀錄"
        icon={<ToolOutline />}
        key="/maintenance"
      />
      <TabBar.Item
        title="設定"
        icon={<SetOutline />}
        key="/settings"
      />
    </TabBar>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/records" element={<Records />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <TabBarWrapper />
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
