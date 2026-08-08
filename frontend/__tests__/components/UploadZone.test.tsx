import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UploadZone } from '../../src/components/UploadZone';
import '@testing-library/jest-dom';

describe('UploadZone Component', () => {
  beforeEach(() => {
    window.alert = jest.fn();
  });

  it('renders correctly with default UI', () => {
    render(<UploadZone onFileSelect={() => {}} file={null} isUploading={false} uploadProgress={0} />);
    expect(screen.getByText(/Drag & drop your messy spreadsheet here/i)).toBeInTheDocument();
  });

  it('calls onFileSelect when a file is dropped', () => {
    const handleFileSelect = jest.fn();
    render(<UploadZone onFileSelect={handleFileSelect} file={null} isUploading={false} uploadProgress={0} />);
    
    const dropzone = screen.getByTestId('drop-zone');
    
    const file = new File(['hello'], 'hello.csv', { type: 'text/csv' });
    
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(handleFileSelect).toHaveBeenCalledWith(file);
  });
  
  it('shows error when invalid file type is dropped', () => {
    const handleFileSelect = jest.fn();
    render(<UploadZone onFileSelect={handleFileSelect} file={null} isUploading={false} uploadProgress={0} />);
    
    const dropzone = screen.getByTestId('drop-zone');
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [file],
      },
    });
    
    // It should not call onFileSelect for invalid types (not CSV/XLSX)
    expect(handleFileSelect).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith("Only CSV and XLSX files are supported.");
  });
});
