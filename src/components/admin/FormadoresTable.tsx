import { Search, Pencil, FileDown, Trash2 } from 'lucide-react'; // Search still used in input icon
import { useState } from 'react';
import { apiService } from '../../services/api';
import { TableSkeleton } from './TableSkeleton';
import { F } from '../../config/sheetsSchema';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 25;

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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);

  if (fetching) return <TableSkeleton />;
  if (!data || data.length <= 1) return <div className="glass" style={{ padding: '2rem' }}>Sem candidaturas para mostrar.</div>;

  const headers = data[0];
  const rows = data.slice(1);

  const handleDelete = (index: number) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Eliminar #{index}?</span>
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Esta ação é irreversível.</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button onClick={async () => {
            toast.dismiss(t.id);
            setDeleting(index);
            try { await apiService.deleteRow('Formadores', index); toast.success('Registo eliminado!'); onRefresh(); }
            catch { toast.error('Erro ao eliminar.'); }
            finally { setDeleting(null); }
          }} style={{ padding: '4px 12px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Eliminar</button>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '4px 12px', borderRadius: '6px', background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Cancelar</button>
        </div>
      </div>
    ), { duration: Infinity, icon: '🗑️' });
  };

  const handleBulkDelete = () => {
    const count = selected.size;
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Eliminar {count} candidatura(s)?</span>
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Esta ação é irreversível.</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              await apiService.bulkDelete('Formadores', [...selected]);
              toast.success(`${count} candidatura(s) eliminada(s)!`);
              setSelected(new Set());
              onRefresh();
            } catch { toast.error('Erro ao eliminar registos.'); }
          }} style={{ padding: '4px 12px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Eliminar {count}</button>
          <button onClick={() => toast.dismiss(t.id)} style={{ padding: '4px 12px', borderRadius: '6px', background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Cancelar</button>
        </div>
      </div>
    ), { duration: Infinity, icon: '🗑️' });
  };

  const rowsWithIdx = rows.map((row, i) => ({ row, originalIndex: i + 1 }));
  const filteredRows = rowsWithIdx.filter(({ row }) => {
    const term = search.toLowerCase();
    const nome = String(row[F.NOME] || '').toLowerCase();
    const email = String(row[F.EMAIL] || '').toLowerCase();
    const telefone = String(row[F.TELEFONE] || '').toLowerCase();
    const nif = String(row[F.NIF] || '').toLowerCase();
    return nome.includes(term) || email.includes(term) || telefone.includes(term) || nif.includes(term);
  });

  const handleExport = () => {
    const sheetData = [headers, ...filteredRows.map(({ row }) => row)];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Formadores');
    XLSX.writeFile(wb, `FaroForma_Formadores_${new Date().toLocaleDateString('pt-PT').replace(/\//g, '-')}.xlsx`);
  };

  const displayRows = [...filteredRows].reverse().map(({ row, originalIndex }) => ({
    originalIndex,
    cells: row
  }));

  const totalPages = Math.ceil(displayRows.length / PAGE_SIZE);
  const pageRows = displayRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageIndices = pageRows.map(r => r.originalIndex);
  const allPageSelected = pageIndices.length > 0 && pageIndices.every(i => selected.has(i));

  const toggleSelectAll = () => {
    const newSel = new Set(selected);
    if (allPageSelected) {
      pageIndices.forEach(i => newSel.delete(i));
    } else {
      pageIndices.forEach(i => newSel.add(i));
    }
    setSelected(newSel);
  };

  const toggleSelect = (idx: number) => {
    const newSel = new Set(selected);
    if (newSel.has(idx)) newSel.delete(idx); else newSel.add(idx);
    setSelected(newSel);
  };

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
              onChange={(e) => { setSearch(e.target.value); setPage(0); setSelected(new Set()); }}
              style={{ paddingLeft: '2.5rem', height: '40px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
        <button className="btn btn--outline btn--small" onClick={handleExport}>
          <FileDown size={16} /> Exportar Excel ({filteredRows.length})
        </button>
      </div>

      {selected.size > 0 && (
        <div style={{ padding: '0.6rem 1.5rem', background: 'rgba(239,68,68,0.06)', borderBottom: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>{selected.size} selecionado(s)</span>
          <button
            onClick={handleBulkDelete}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '4px 12px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
          >
            <Trash2 size={13} /> Eliminar selecionados
          </button>
          <button
            onClick={() => setSelected(new Set())}
            style={{ padding: '4px 10px', borderRadius: '6px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <colgroup>
            <col style={{ width: '3%' }} />   {/* Checkbox */}
            <col style={{ width: '5%' }} />   {/* ID */}
            <col style={{ width: '20%' }} />  {/* Nome */}
            <col style={{ width: '12%' }} />  {/* Tel */}
            <col style={{ width: '25%' }} />  {/* Áreas */}
            <col style={{ width: '12%' }} />  {/* Dias */}
            <col style={{ width: '9%' }} />   {/* Período */}
            <col style={{ width: '7%' }} />   {/* Email✓ */}
            <col style={{ width: '7%' }} />   {/* Ações */}
          </colgroup>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', padding: '0.6rem' }}>
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
              </th>
              <th>ID</th>
              <th>Nome</th>
              <th>Tel</th>
              <th>Áreas</th>
              <th>Dias</th>
              <th>Período</th>
              <th title="Confirmação de email enviada">Email✓</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((item, i) => (
              <tr key={i}
                onClick={() => onDetail(item)}
                style={{ cursor: 'pointer', ...(selected.has(item.originalIndex) ? { background: 'rgba(239,68,68,0.04)' } : {}) }}
              >
                <td style={{ textAlign: 'center', padding: '0.6rem' }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(item.originalIndex)} onChange={() => toggleSelect(item.originalIndex)} style={{ cursor: 'pointer' }} />
                </td>
                <td style={{ fontWeight: 700 }}>#{item.originalIndex}</td>
                <td style={{ color: 'var(--text)', fontWeight: 600 }}>{item.cells[F.NOME]}</td>
                <td>{item.cells[F.TELEFONE]}</td>
                <td><span className="cell-truncate" title={item.cells[F.AREAS]}>{item.cells[F.AREAS]}</span></td>
                <td>{item.cells[F.DIAS]}</td>
                <td>{item.cells[F.PERIODOS]}</td>
                <td style={{ textAlign: 'center' }}>
                  {item.cells[F.EMAIL_CONF] === 'Sim'
                    ? <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>✓</span>
                    : <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>—</span>
                  }
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
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

      {totalPages > 1 && (
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, displayRows.length)} de {displayRows.length}
          </span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[
              { label: '«', disabled: page === 0, onClick: () => setPage(0) },
              { label: '‹', disabled: page === 0, onClick: () => setPage(p => p - 1) },
              { label: `${page + 1} / ${totalPages}`, disabled: true, onClick: () => {} },
              { label: '›', disabled: page >= totalPages - 1, onClick: () => setPage(p => p + 1) },
              { label: '»', disabled: page >= totalPages - 1, onClick: () => setPage(totalPages - 1) },
            ].map((btn, i) => (
              <button key={i} onClick={btn.onClick} disabled={btn.disabled}
                style={{ padding: '3px 9px', borderRadius: '5px', border: '1px solid var(--border)', background: btn.disabled ? 'transparent' : 'var(--bg-2)', color: btn.disabled ? 'var(--text-muted)' : 'var(--text)', cursor: btn.disabled ? 'default' : 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
