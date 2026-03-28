import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
}

export default function AppTable<T>({ columns, data, keyExtractor }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-[var(--text-muted)] uppercase text-[11px] font-medium tracking-wider text-left py-3 px-4 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={keyExtractor(row)}
              className="border-b border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.03)] transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className={`py-3 px-4 text-sm ${col.className || ''}`}>
                  {col.render(row, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
