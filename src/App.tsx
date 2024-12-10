import React, { useEffect } from 'react';
import { TabBar } from 'antd-mobile';
import { 
  AppOutline,
  UnorderedListOutline,
  SetOutline,
  PieOutline,
  EditSOutline
} from 'antd-mobile-icons';
import { useLocation, useNavigate, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Records from './pages/Records';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import Maintenance from './pages/Maintenance';
import { useThemeStore } from './stores/themeStore';
import './App.css';
import './styles/theme.css';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  // 初始化主題
  useEffect(() => {
    // 移除所有主題類
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    
    // 根據存儲的主題設置應用主題
    if (theme !== 'system') {
      document.documentElement.classList.add(`theme-${theme}`);
    }

    // 更新 meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        metaThemeColor.setAttribute('content', '#1a1a1a'); // 深色模式背景色
      } else {
        metaThemeColor.setAttribute('content', '#ffffff'); // 淺色模式背景色
      }
    }

    // 監聽系統主題變化
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e: MediaQueryListEvent) => {
        if (metaThemeColor) {
          metaThemeColor.setAttribute('content', e.matches ? '#1a1a1a' : '#ffffff');
        }
      };
      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
  }, [theme]);

  const tabs = [
    {
      key: '/',
      title: '首頁',
      icon: <AppOutline />,
    },
    {
      key: '/records',
      title: '充電記錄',
      icon: <UnorderedListOutline />,
    },
    {
      key: '/maintenance',
      title: '維修',
      icon: <EditSOutline />,
    },
    {
      key: '/statistics',
      title: '統計',
      icon: <PieOutline />,
    },
    {
      key: '/settings',
      title: '設定',
      icon: <SetOutline />,
    },
  ];

  return (
    <div className="app">
      <div className="app-body">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/records" element={<Records />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
      <div className="bottom-nav">
        <TabBar
          activeKey={location.pathname}
          onChange={value => navigate(value)}
          className="tab-bar"
        >
          {tabs.map(item => (
            <TabBar.Item
              key={item.key}
              icon={item.icon}
              title={item.title}
            />
          ))}
        </TabBar>
      </div>
    </div>
  );
};

export default App;
