import { Search, Pencil, FileDown, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { apiService } from '../../services/api';
import { TableSkeleton } from './TableSkeleton';
import toast from 'react-hot-toast';

interface FormadoresTableProps {
  data: any[][];
  fetching: boolean;
  onRefresh: () => void;
  onEdit: (row: any) => void;
  onDetail: (row: any) => void;
}

export function FormadoresTable({ data, fetching, onRefresh, onEdit, onDetail }: FormadoresTableProps) {
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  
  if (fetching) return <TableSkeleton />;
  if (!data || data.length <= 1) return <div className="glass" style={{ padding: '2rem' }}>Sem candidaturas para mostrar.</div>;

  const headers = data[0];
  const rows = data.slice(1);

  const handleDelete = async (index: number) => {
    if (!confirm(`Tem a certeza que deseja eliminar o registo #${index}?`)) return;
    setDeleting(index);
    try {
      await apiService.deleteRow('Formadores', index);
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
    const nome = String(row[1] || '').toLowerCase();
    const email = String(row[2] || '').toLowerCase();
    const telefone = String(row[3] || '').toLowerCase();
    const nif = String(row[5] || '').toLowerCase();
    return nome.includes(term) || email.includes(term) || telefone.includes(term) || nif.includes(term);
  });

  const handleExport = () => {
    const csvContent = [
      headers.join(','),
      ...filteredRows.map(({ row }) => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `FaroForma_Formadores_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const indexedRows = [...filteredRows].reverse().map(({ row, originalIndex }) => ({
    originalIndex,
    cells: row
  }));

  return (
    <div className="admin-table-container glass">
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
          <h4 style={{ margin: 0, whiteSpace: 'nowrap' }}>Candidaturas de Formadores</h4>
          <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form__input" 
              placeholder="Pesquisar por nome, email, telefone ou NIF..."
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
          <colgroup>
            <col style={{ width: '4%' }} />   {/* ID */}
            <col style={{ width: '14%' }} />  {/* Nome */}
            <col style={{ width: '16%' }} />  {/* Email */}
            <col style={{ width: '10%' }} />  {/* Telefone */}
            <col style={{ width: '18%' }} />  {/* Áreas */}
            <col style={{ width: '10%' }} />  {/* Dias */}
            <col style={{ width: '9%' }} />   {/* Períodos */}
            <col style={{ width: '9%' }} />   {/* Modalidade */}
            <col style={{ width: '10%' }} />  {/* Data */}
            <col style={{ width: '8%' }} />   {/* Ações */}
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Áreas</th>
              <th>Dias</th>
              <th>Períodos</th>
              <th>Modalidade</th>
              <th>Data Registo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {indexedRows.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 700 }}>#{item.originalIndex}</td>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>{item.cells[1]}</td>
                <td>{item.cells[2]}</td>
                <td>{item.cells[3]}</td>
                <td><span className="cell-truncate" title={item.cells[6]}>{item.cells[6]}</span></td>
                <td>{item.cells[11]}</td>
                <td>{item.cells[12]}</td>
                <td>{item.cells[13]}</td>
                <td>{new Date(item.cells[0]).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-action-btn" onClick={() => onDetail(item)} title="Ver Detalhes">
                      <Search size={16} />
                    </button>
                    <button className="admin-action-btn" onClick={() => onEdit(item)} title="Editar">
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
