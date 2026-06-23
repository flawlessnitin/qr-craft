import type { ContentType, FieldConfig } from '../lib/qr-formatters';
import { CONTENT_TYPES } from '../lib/qr-formatters';

interface DynamicFormProps {
  type: ContentType;
  formData: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

export default function DynamicForm({ type, formData, onChange }: DynamicFormProps) {
  const config = CONTENT_TYPES.find((ct) => ct.id === type);
  if (!config) return null;

  return (
    <div className="form-panel" key={type}>
      <div className="form-panel-header">
        <div className="form-panel-icon" aria-hidden="true">{config.icon}</div>
        <div className="form-panel-title">{config.label} Details</div>
      </div>

      {config.fields.map((field: FieldConfig) => (
        <div className="form-group" key={field.name}>
          <label className="form-label" htmlFor={`field-${field.name}`}>
            {field.label}
            {field.required && <span className="req">*</span>}
          </label>

          {field.type === 'textarea' ? (
            <textarea
              id={`field-${field.name}`}
              className="form-textarea"
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              rows={3}
            />
          ) : field.type === 'select' ? (
            <select
              id={`field-${field.name}`}
              className="form-select"
              value={formData[field.name] || field.options?.[0]?.value || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              id={`field-${field.name}`}
              className="form-input"
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
