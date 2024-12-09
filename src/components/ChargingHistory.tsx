import { useState, useEffect } from 'react';
import { useChargingStore } from '../stores/chargingStore';
import dayjs from 'dayjs';
import '../styles/ChargingHistory.css';

const ChargingHistory = () => {
  const records = useChargingStore(state => state.records);
  const loadRecords = useChargingStore(state => state.loadRecords);
  const [selectedYear, setSelectedYear] = useState<string>(dayjs().format('YYYY'));
  const [selectedMonth, setSelectedMonth] = useState<string>(dayjs().format('MM'));
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const pageSize = 10;

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonth, searchKeyword]);

  // 格式化函數
  const formatDate = (date: string) => dayjs(date).format('YYYY/MM/DD');
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小時 ${mins}分鐘`;
  };

  // 篩選記錄
  const filteredRecords = records.filter(record => {
    const matchesDate = dayjs(record.date).format('YYYY') === selectedYear && 
                       dayjs(record.date).format('MM') === selectedMonth;
    
    if (!searchKeyword) return matchesDate;

    const keyword = searchKeyword.toLowerCase();
    return matchesDate && (
      record.stationName.toLowerCase().includes(keyword) ||
      record.vendor?.toLowerCase().includes(keyword) ||
      record.note?.toLowerCase().includes(keyword)
    );
  });

  // 計算分頁
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  // 計算總計
  const pageTotal = paginatedRecords.reduce((acc, record) => ({
    power: acc.power + record.power,
    cost: acc.cost + record.chargingFee + (record.parkingFee || 0)
  }), { power: 0, cost: 0 });

  return (
    <div className="charging-history">
      <div className="history-header">
        <div className="filters">
          <div className="filter-group">
            <label>年份：</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="year-select"
            >
              {Array.from({ length: 5 }, (_, i) => dayjs().subtract(i, 'year').format('YYYY'))
                .map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
            </select>
          </div>

          <div className="filter-group">
            <label>月份：</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="month-select"
            >
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
                .map(month => (
                  <option key={month} value={month}>{month}月</option>
                ))}
            </select>
          </div>

          <div className="search-group">
            <input
              type="search"
              placeholder="搜尋充電站、店家或備註..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="page-summary">
          <div className="summary-item">
            <span>本頁充電量：</span>
            <span className="summary-value">{pageTotal.power.toFixed(2)} kWh</span>
          </div>
          <div className="summary-item">
            <span>本頁費用：</span>
            <span className="summary-value">{formatCurrency(pageTotal.cost)}</span>
          </div>
        </div>
      </div>

      <div className="records-grid">
        {paginatedRecords.map(record => (
          <div key={record.id} className="record-card">
            <div className="record-card-header">
              <div className="record-date">{formatDate(record.date)}</div>
              <div className="record-station">{record.stationName}</div>
            </div>
            
            <div className="record-card-body">
              <div className="record-info">
                <div className="info-row">
                  <span className="label">充電量：</span>
                  <span className="value">{record.power} kWh</span>
                </div>
                <div className="info-row">
                  <span className="label">充電時間：</span>
                  <span className="value">{formatDuration(record.duration)}</span>
                </div>
                <div className="info-row">
                  <span className="label">充電費用</span>
                  <span className="value">{formatCurrency(record.chargingFee + (record.parkingFee || 0))}</span>
                </div>
              </div>
              
              {record.note && (
                <div className="record-note">
                  <span className="label">備註：</span>
                  <span className="value">{record.note}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            上一頁
          </button>
          <span>{currentPage} / {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
};

export default ChargingHistory; 