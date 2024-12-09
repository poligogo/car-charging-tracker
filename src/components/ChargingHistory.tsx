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
  const pageSize = 10;

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedMonth]);

  const formatDate = (date: string) => {
    return dayjs(date).format('YYYY/MM/DD');
  };

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

  // 根據年月篩選記錄
  const filteredRecords = records.filter(record => {
    const recordDate = dayjs(record.date);
    return recordDate.format('YYYY') === selectedYear && 
           recordDate.format('MM') === selectedMonth;
  });

  // 計算分頁
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
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
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        {paginatedRecords.map(record => (
          <div key={record.id} style={{
            backgroundColor: 'white',
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div className="record-header">
              <div className="record-date-group">
                <span className="record-date">{formatDate(record.date)}</span>
                <span className="record-time">
                  {record.startTime} - {record.endTime}
                </span>
              </div>
              <span className="record-station">{record.stationName}</span>
            </div>
            <div className="record-details">
              <div className="record-info-group">
                <div className="record-power">
                  <span className="label">充電量：</span>
                  <span className="value">{record.power} kWh</span>
                </div>
                <div className="record-duration">
                  <span className="label">充電���間：</span>
                  <span className="value">{formatDuration(record.duration)}</span>
                </div>
              </div>
              <div className="record-fee-group">
                <div className="record-charging-fee">
                  <span className="label">充電費用：</span>
                  <span className="value">{formatCurrency(record.chargingFee)}</span>
                </div>
                {record.parkingFee && record.parkingFee > 0 && (
                  <div className="record-parking-fee">
                    <span className="label">停車費用：</span>
                    <span className="value">{formatCurrency(record.parkingFee)}</span>
                  </div>
                )}
                <div className="record-total-fee">
                  <span className="label">總費用：</span>
                  <span className="value">
                    {formatCurrency(record.chargingFee + (record.parkingFee || 0))}
                  </span>
                </div>
              </div>
            </div>
            {record.note && (
              <div className="record-note">
                <span className="label">備註：</span>
                <span className="value">{record.note}</span>
              </div>
            )}
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