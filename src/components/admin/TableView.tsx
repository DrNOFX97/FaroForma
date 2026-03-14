import { useState } from 'react';
import { Search, FileDown } from 'lucide-react';

interface TableViewProps {
  type: string;
  data: any[][];
  fetching: boolean;
  onDetail: (row: any) => void;
}

export function TableView({ type, data, fetching, onDetail }: TableViewProps) {
  const [search, setSearch] = useState('');

  if (fetching) return <div className="glass" style={{ padding: '2rem' }}>A carregar dados...</div>;
  if (!data || data.length <= 1) return <div className="glass" style={{ padding: '2rem' }}>Sem dados em <strong>{type}</strong>.</div>;

  const headers = data[0];
  const rows = data.slice(1);

  const filteredRows = rows.filter(row => {
    const term = search.toLowerCase();
    return row.some(cell => String(cell || '').toLowerCase().includes(term));
  });

  const handleExport = () => {
    const csvContent = [
      headers.join(','),
      ...filteredRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `FaroForma_${type.charAt(0).toUpperCase() + type.slice(1)}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayRows = filteredRows.reverse().map((row) => ({
    originalIndex: rows.indexOf(row) + 1,
    cells: row
  }));

  return (
    <div className="admin-table-container glass">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
          <h4 style={{ margin: 0, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{type}</h4>
          <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form__input" 
              placeholder={`Pesquisar em ${type}...`} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
        <button className="btn btn--outline btn--small" onClick={handleExport}>
          <FileDown size={16} /> Exportar CSV ({filteredRows.length})
        </button>
      </div>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {headers.map((h, i) => <th key={i}>{h}</th>)}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((item, i) => (
              <tr key={i}>
                {item.cells.map((cell: any, j: number) => <td key={j}>{cell}</td>)}
                <td>
                  <button className="admin-action-btn" onClick={() => {
                    const obj: any = { originalIndex: item.originalIndex };
                    headers.forEach((h: string, idx: number) => {
                      obj[h] = item.cells[idx];
                    });
                    onDetail(obj);
                  }} title="Ver Detalhes">
                    <Search size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
