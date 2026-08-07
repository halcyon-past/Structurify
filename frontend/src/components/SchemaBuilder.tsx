import { Plus, Trash2 } from "lucide-react";

export type FieldType = "String" | "Integer" | "Float" | "Boolean" | "Date";

export interface SchemaField {
  name: string;
  type: FieldType;
  required: boolean;
}

interface SchemaBuilderProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
}

export function SchemaBuilder({ fields, onChange, onSubmit, isSubmitting, isSubmitDisabled }: SchemaBuilderProps) {
  const addField = () => {
    onChange([...fields, { name: "", type: "String", required: false }]);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof SchemaField, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    onChange(newFields);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">2. Define Target Schema</h2>
        <button 
          onClick={addField}
          className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={16} /> Add Field
        </button>
      </div>
      
      <div className="flex-grow overflow-auto" data-testid="schema-fields-container">
        {fields.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No fields defined.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {fields.map((field, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 group" data-testid="schema-row">
                <input 
                  type="text" 
                  value={field.name}
                  onChange={(e) => updateField(idx, 'name', e.target.value)}
                  placeholder="Field Name"
                  className="flex-grow bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select 
                  value={field.type}
                  onChange={(e) => updateField(idx, 'type', e.target.value)}
                  className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="String">String</option>
                  <option value="Integer">Integer</option>
                  <option value="Float">Float</option>
                  <option value="Boolean">Boolean</option>
                  <option value="Date">Date</option>
                </select>
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  <input 
                    type="checkbox" 
                    checked={field.required}
                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Req
                </label>
                <button 
                  onClick={() => removeField(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  data-testid="remove-field"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button 
          onClick={onSubmit}
          disabled={isSubmitting || isSubmitDisabled}
          className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {isSubmitting ? "Processing..." : "Compile Heterogeneous Data"}
        </button>
      </div>
    </div>
  );
}
