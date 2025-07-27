import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const Chart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '300px',
        color: '#666',
        fontSize: '16px'
      }}>
        차트 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="date" 
            stroke="#fff"
            fontSize={12}
            tick={{ fill: '#fff' }}
          />
          <YAxis 
            stroke="#fff"
            fontSize={12}
            tick={{ fill: '#fff' }}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#333', 
              border: '1px solid #555',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value) => [`$${value.toLocaleString()}`, '계좌 가치']}
          />
          <Line 
            type="monotone" 
            dataKey="total_assets" 
            stroke="#4CAF50" 
            strokeWidth={3}
            dot={{ fill: '#4CAF50', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#4CAF50', strokeWidth: 2, fill: '#fff' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
