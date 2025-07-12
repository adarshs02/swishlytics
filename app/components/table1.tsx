"use client";

import React from 'react';

interface Column<T> {
  key: keyof T | (string & {});
  label: string;
  isSortable?: boolean;
}

interface Table1Props<T> {
  columns: Column<T>[];
  data: T[];
  renderCell: (item: T, columnKey: keyof T | (string & {})) => React.ReactNode;
  onHeaderClick?: (columnKey: keyof T | (string & {})) => void;
  getSortIndicator?: (columnKey: keyof T | (string & {})) => React.ReactNode;
  getCellStyle?: (item: T, columnKey: keyof T | (string & {})) => React.CSSProperties;
}

const Table1 = <T extends { player_id?: string; season?: string }>(
  { columns, data, renderCell, onHeaderClick, getSortIndicator, getCellStyle }: Table1Props<T>
) => {
  return (
    <div id="rankings-table-container">
      <div className="table-container">
        <table id="rankings-table" className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  onClick={() => onHeaderClick && col.isSortable && onHeaderClick(col.key)}
                  className={`px-4 py-2 ${col.isSortable ? 'cursor-pointer' : ''}`}
                >
                  {col.label} {getSortIndicator && getSortIndicator(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-4">
                  No data available.
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={item.player_id ? `${item.player_id}-${rowIndex}` : `${item.season}-${rowIndex}`}>
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="border-t px-4 py-2"
                      style={getCellStyle ? getCellStyle(item, col.key) : {}}
                    >
                      {renderCell(item, col.key)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table1;