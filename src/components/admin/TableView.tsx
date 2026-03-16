import { useState } from 'react';
import { Search, FileDown, Pencil, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { TableSkeleton } from './TableSkeleton';
import toast from 'react-hot-toast';

interface TableViewProps {
  type: string;
  data: any[][];
  fetching: boolean;
  onRefresh: () => void;
  onEdit: (row: any) => void;
  onDetail: (row: any) => void;
}

export function TableView({ type, data, fetching, onRefresh, onEdit, onDetail }: TableViewProps) {
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  if (fetching) return <TableSkeleton />;
  if (!data || data.length <= 1) return <div className="glass" style={{ padding: '2rem' }}>Sem dados em <strong>{type}</strong>.</div>;

  const headers = data[0];
  const rows = data.slice(1);

  const handleDelete = async (index: number) => {
    const tabName = type.charAt(0).toUpperCase() + type.slice(1); // alunos -> Alunos
    if (!confirm(`Tem a certeza que deseja eliminar o registo #${index} de ${type}?`)) return;
    setDeleting(index);
    try {
      await apiService.deleteRow(tabName, index);
      toast.success('Registo eliminado!');
      onRefresh();
    } catch (err) {
      toast.error('Erro ao eliminar.');
    } finally {
      setDeleting(null);
    }
  };

  const rowsWithIdx = rows.map((row, i) => ({ row, originalIndex: i + 1 }));
  const filteredRows = rowsWithIdx.filter(({ row }) => {
    const term = search.toLowerCase();
    return row.some(cell => String(cell || '').toLowerCase().includes(term));
  });

  const handleExport = () => {
    const csvContent = [
      headers.join(','),
      ...filteredRows.map(({ row }) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `FaroForma_${type.charAt(0).toUpperCase() + type.slice(1)}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayRows = [...filteredRows].reverse().map(({ row, originalIndex }) => ({
    originalIndex,
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
                {item.cells.map((cell: any, j: number) => (
                  <td key={j}><span className="cell-truncate" title={String(cell ?? '')}>{cell}</span></td>
                ))}
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-action-btn" onClick={() => {
                      const obj: any = { originalIndex: item.originalIndex, cells: item.cells };
                      headers.forEach((h: string, idx: number) => {
                        obj[h] = item.cells[idx];
                      });
                      onDetail(obj);
                    }} title="Ver Detalhes">
                      <Search size={16} />
                    </button>
                    <button className="admin-action-btn" onClick={() => {
                      onEdit({ originalIndex: item.originalIndex, cells: item.cells, type });
                    }} title="Editar">
                      <Pencil size={16} />
                    </button>
                    <button 
                      className="admin-action-btn" 
                      onClick={() => handleDelete(item.originalIndex)} 
                      title="Eliminar"
                      style={{ color: '#ef4444' }}
                      disabled={deleting === item.originalIndex}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
