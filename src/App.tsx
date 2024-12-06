import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, SetOutline } from 'antd-mobile-icons';
import { Home, Records, Statistics, Settings } from './pages';
import ErrorBoundary from './components/ErrorBoundary';

const TabBarWrapper = () => {
  const navigate = useNavigate();
  
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
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/records" element={<Records />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
          <TabBarWrapper />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
