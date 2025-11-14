import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { AdvancedClause, AdvancedOperator } from '../../types/search';
import { FIELD_LABELS } from '../../constants/fieldLabels';

interface AdvancedSearchBuilderProps {
  clauses: AdvancedClause[];
  onApply: (clauses: AdvancedClause[]) => void;
  onCancel: () => void;
  onReset: () => void;
}

type BuilderRow = AdvancedClause & { id: string };

const OPERATORS: AdvancedOperator[] = ['AND', 'OR', 'NOT'];

const COMMON_FIELD_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all_fields', label: 'All Text' },
  { value: 'dct_title_s', label: 'Title' },
  { value: 'dct_description_sm', label: 'Description' },
  { value: 'dct_spatial_sm', label: 'Place / Country' },
  { value: 'gbl_resourceClass_sm', label: 'Resource Class' },
  { value: 'gbl_resourceType_sm', label: 'Resource Type' },
  { value: 'dct_subject_sm', label: 'Subject' },
  { value: 'dct_provenance_s', label: 'Institution' },
];

const generateRowId = () => {
  const globalCrypto = typeof globalThis !== 'undefined' ? (globalThis.crypto as Crypto | undefined) : undefined;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

function createRow(partial?: Partial<AdvancedClause>): BuilderRow {
  return {
    id: generateRowId(),
    op: partial?.op || 'AND',
    field: partial?.field || 'all_fields',
    q: partial?.q || '',
  };
}

export function AdvancedSearchBuilder({
  clauses,
  onApply,
  onCancel,
  onReset,
}: AdvancedSearchBuilderProps) {
  const [rows, setRows] = useState<BuilderRow[]>(() =>
    clauses.length > 0 ? clauses.map((clause) => createRow(clause)) : [createRow()]
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(clauses.length > 0 ? clauses.map((clause) => createRow(clause)) : [createRow()]);
  }, [clauses]);

  const fieldOptions = useMemo(() => {
    const seen = new Set(COMMON_FIELD_OPTIONS.map((option) => option.value));

    // Fields to exclude from the dropdown
    const excludedFields = new Set([
      'layer_modified_dt', // Last Modified
      'gbl_mdversion_s', // Metadata Version
      'layer_slug_s', // Layer ID
      'layer_id_s', // Layer Identifier
      'gbl_wxsidentifier_s', // WXS Identifier
      'dct_references_s', // References
      'dcat_bbox', // Bounding Box
      'dcat_bbox_original', // Bounding Box
      'dcat_centroid', // Centroid
      'dcat_centroid_original', // Centroid
      'locn_geometry', // Geometry
      'locn_geometry_original', // Geometry
      'solr_geom', // Geometry
      'dc_publisher_sm', // Duplicate Publisher (prefer dct_publisher_sm)
      'dc_type_sm', // Duplicate Type (prefer dct_type_sm)
    ]);

    const remaining = Object.entries(FIELD_LABELS)
      .filter(([field]) => !seen.has(field) && !excludedFields.has(field))
      .map(([field, config]) => ({
        value: field,
        label: config.label || field,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [...COMMON_FIELD_OPTIONS, ...remaining];
  }, []);

  const updateRow = (id: string, key: keyof AdvancedClause, value: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, createRow()]);
  };

  const handleApply = () => {
    const sanitized = rows
      .map(({ op, field, q }) => ({
        op,
        field,
        q: q.trim(),
      }))
      .filter((row) => row.q.length > 0);

    setError(null);
    onApply(sanitized);
  };

  const handleReset = () => {
    setRows([createRow()]);
    setError(null);
    onReset();
  };

  return (
    <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-blue-800">Advanced Search Builder</h3>
          <p className="text-sm text-blue-600">
            Combine multiple fields and boolean operators to refine your results.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="Close advanced search builder"
        >
          <X className="h-4 w-4" />
          Close
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="flex flex-col gap-3 md:grid md:grid-cols-12 md:items-center md:gap-4"
          >
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-xs font-semibold text-blue-700 uppercase">Operator</span>
              <select
                value={row.op}
                onChange={(event) => updateRow(row.id, 'op', event.target.value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {OPERATORS.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 md:col-span-4">
              <span className="text-xs font-semibold text-blue-700 uppercase">Field</span>
              <select
                value={row.field}
                onChange={(event) => updateRow(row.id, 'field', event.target.value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {fieldOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 md:col-span-5">
              <span className="text-xs font-semibold text-blue-700 uppercase">Value</span>
              <input
                type="text"
                value={row.q}
                onChange={(event) => updateRow(row.id, 'q', event.target.value)}
                className="rounded-md border border-blue-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter search term"
              />
            </label>

            <div className="flex justify-end md:col-span-1">
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors disabled:text-blue-300"
                disabled={rows.length === 1}
                aria-label={rows.length === 1 ? 'Cannot remove the last row' : 'Remove condition'}
              >
                <X className="h-4 w-4" />
                {index === 0 ? 'Clear' : 'Remove'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:border-blue-400 hover:text-blue-900 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Condition
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:border-blue-400 hover:text-blue-900 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

