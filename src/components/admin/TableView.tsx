import { useState } from 'react';
import { Search, FileDown, Pencil, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import { TableSkeleton } from './TableSkeleton';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 25;

interface TableViewProps {
  type: string;
  data: any[][];
  fetching: boolean;
  onRefresh: () => void;
  onEdit: (row: any) => void;
  onDetail: (row: any) => void;
  /** If provided, only these column indices are shown (ID + Ações always included). CSV still exports all columns. */
  columns?: number[];
  /** Override display labels for specific column indices, e.g. { 0: 'Data/Hora' } */
  headerMap?: Record<number, string>;
  /** Format cell values for specific column indices, e.g. { 0: v => new Date(v).toLocaleString() } */
  cellFormat?: Record<number, (v: any) => string>;
}

export function TableView({ type, data, fetching, onRefresh, onEdit, onDetail, columns, headerMap, cellFormat }: TableViewProps) {
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(0);

  if (fetching) return <TableSkeleton />;
  if (!data || data.length <= 1) return <div className="glass" style={{ padding: '2rem' }}>Sem dados em <strong>{type}</strong>.</div>;

  const headers = data[0];
  const rows = data.slice(1);
  const tabName = type.charAt(0).toUpperCase() + type.slice(1);

  const handleDelete = (index: number) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Eliminar #{index}?</span>
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Esta ação é irreversível.</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button onClick={async () => {
            toast.dismiss(t.id);
            setDeleting(index);
            try { await apiService.deleteRow(tabName, index); toast.success('Registo eliminado!'); onRefresh(); }
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
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Eliminar {count} registo(s)?</span>
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Esta ação é irreversível.</span>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              await apiService.bulkDelete(tabName, [...selected]);
              toast.success(`${count} registo(s) eliminado(s)!`);
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
    return row.some(cell => String(cell || '').toLowerCase().includes(term));
  });

  const handleExport = () => {
    let exportHeaders: string[];
    let exportRows: any[][];
    if (columns) {
      exportHeaders = columns.map(ci => headerMap?.[ci] ?? headers[ci]);
      exportRows = filteredRows.map(({ row, originalIndex }) => [
        `#${originalIndex}`,
        ...columns.map(ci => cellFormat?.[ci] ? cellFormat[ci](row[ci]) : row[ci]),
      ]);
      exportHeaders = ['ID', ...exportHeaders];
    } else {
      exportHeaders = headers;
      exportRows = filteredRows.map(({ row }) => row);
    }
    const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);
    const wb = XLSX.utils.book_new();
    const tabTitle = tabName;
    XLSX.utils.book_append_sheet(wb, ws, tabTitle);
    XLSX.writeFile(wb, `FaroForma_${tabTitle}_${new Date().toLocaleDateString('pt-PT').replace(/\//g, '-')}.xlsx`);
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
          <h4 style={{ margin: 0, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{type}</h4>
          <div style={{ position: 'relative', maxWidth: '400px', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form__input"
              placeholder={`Pesquisar em ${type}...`}
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
          {columns ? (
            <colgroup>
              <col style={{ width: '3%' }} />  {/* Checkbox */}
              <col style={{ width: '5%' }} />  {/* ID */}
              {columns.map((_, i) => <col key={i} style={{ width: `${Math.floor(74 / columns.length)}%` }} />)}
              <col style={{ width: '18%' }} />  {/* Ações */}
            </colgroup>
          ) : (
            <colgroup>
              <col style={{ width: '3%' }} />  {/* Checkbox */}
              {headers.map((_: any, i: number) => (
                <col key={i} style={{ width: `${Math.floor(79 / headers.length)}%` }} />
              ))}
              <col style={{ width: '18%' }} />
            </colgroup>
          )}
          <thead>
            <tr>
              <th style={{ textAlign: 'center', padding: '0.6rem' }}>
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} style={{ cursor: 'pointer' }} />
              </th>
              {columns ? (
                <>
                  <th>ID</th>
                  {columns.map(ci => <th key={ci}>{headerMap?.[ci] ?? headers[ci]}</th>)}
                  <th>Ações</th>
                </>
              ) : (
                <>
                  {headers.map((h: string, i: number) => <th key={i}>{headerMap?.[i] ?? h}</th>)}
                  <th>Ações</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((item, i) => (
              <tr key={i} style={selected.has(item.originalIndex) ? { background: 'rgba(239,68,68,0.04)' } : undefined}>
                <td style={{ textAlign: 'center', padding: '0.6rem' }}>
                  <input type="checkbox" checked={selected.has(item.originalIndex)} onChange={() => toggleSelect(item.originalIndex)} style={{ cursor: 'pointer' }} />
                </td>
                {columns ? (
                  <>
                    <td style={{ fontWeight: 700 }}>#{item.originalIndex}</td>
                    {columns.map(ci => {
                      const raw = item.cells[ci];
                      const display = cellFormat?.[ci] ? cellFormat[ci](raw) : raw;
                      return <td key={ci}><span className="cell-truncate" title={String(raw ?? '')}>{display}</span></td>;
                    })}
                  </>
                ) : (
                  item.cells.map((cell: any, j: number) => {
                    const display = cellFormat?.[j] ? cellFormat[j](cell) : cell;
                    return <td key={j}><span className="cell-truncate" title={String(cell ?? '')}>{display}</span></td>;
                  })
                )}
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="admin-action-btn" onClick={() => {
                      const obj: any = { originalIndex: item.originalIndex, cells: item.cells };
                      headers.forEach((h: string, idx: number) => { obj[h] = item.cells[idx]; });
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
