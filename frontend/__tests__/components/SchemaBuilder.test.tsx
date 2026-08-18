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
        email=""
        onEmailChange={jest.fn()}
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
        email=""
        onEmailChange={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Process Job/i }));
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
        email=""
        onEmailChange={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /Process Job/i })).toBeDisabled();
  });

  it('calls onEmailChange when email input changes', () => {
    const onEmailChange = jest.fn();
    render(
      <SchemaBuilder 
        fields={defaultFields} 
        onChange={jest.fn()} 
        onSubmit={jest.fn()} 
        isSubmitting={false} 
        isSubmitDisabled={false} 
        email=""
        onEmailChange={onEmailChange}
      />
    );

    const input = screen.getByPlaceholderText(/Enter email for job completion notification/i);
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(onEmailChange).toHaveBeenCalledWith('test@example.com');
  });
});
