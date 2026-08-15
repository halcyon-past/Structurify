import { render, screen } from '@testing-library/react';
import { JobStatus } from '@/components/JobStatus';

describe('JobStatus', () => {
  it('renders queued status correctly', () => {
    render(<JobStatus jobId="123" jobState={{ status: 'queued' }} />);
    expect(screen.getByText('ID: 123')).toBeInTheDocument();
    expect(screen.getByTestId('status-text')).toHaveTextContent('queued');
  });

  it('renders completed status and download link', () => {
    render(
      <JobStatus 
        jobId="123" 
        jobState={{ 
          status: 'completed', 
          processed_rows: 50, 
          duration_seconds: 5, 
          download_url: 'https://test.com' 
        }} 
      />
    );
    expect(screen.getByTestId('status-completed')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('5s')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download Clean Dataset/i })).toHaveAttribute('href', 'https://test.com');
  });

  it('renders failed status with error message', () => {
    render(
      <JobStatus 
        jobId="123" 
        jobState={{ status: 'failed', error_message: 'Format error' }} 
      />
    );
    expect(screen.getByTestId('status-failed')).toBeInTheDocument();
    expect(screen.getByText('Format error')).toBeInTheDocument();
  });

  it('renders cancelled status with message', () => {
    render(
      <JobStatus 
        jobId="123" 
        jobState={{ status: 'cancelled', error_message: 'Job cancelled' }} 
      />
    );
    expect(screen.getByTestId('status-failed')).toBeInTheDocument();
    expect(screen.getByText('Job cancelled')).toBeInTheDocument();
  });
});
