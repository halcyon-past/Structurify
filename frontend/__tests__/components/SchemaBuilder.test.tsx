import { render, screen, fireEvent } from '@testing-library/react';
import { SchemaBuilder, SchemaField } from '@/components/SchemaBuilder';

describe('SchemaBuilder', () => {
  const defaultFields: SchemaField[] = [
    { name: 'id', type: 'Integer', required: true }
  ];

  it('renders fields correctly', () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn();

    render(
      <SchemaBuilder 
        fields={defaultFields} 
        onChange={onChange} 
        onSubmit={onSubmit} 
        isSubmitting={false} 
        isSubmitDisabled={false} 
      />
    );

    expect(screen.getByDisplayValue('id')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Integer')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onSubmit when button is clicked', () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn();

    render(
      <SchemaBuilder 
        fields={defaultFields} 
        onChange={onChange} 
        onSubmit={onSubmit} 
        isSubmitting={false} 
        isSubmitDisabled={false} 
      />
    );

    fireEvent.click(screen.getByText('Compile Heterogeneous Data'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when isSubmitDisabled is true', () => {
    const onChange = jest.fn();
    const onSubmit = jest.fn();

    render(
      <SchemaBuilder 
        fields={defaultFields} 
        onChange={onChange} 
        onSubmit={onSubmit} 
        isSubmitting={false} 
        isSubmitDisabled={true} 
      />
    );

    expect(screen.getByText('Compile Heterogeneous Data')).toBeDisabled();
  });
});
